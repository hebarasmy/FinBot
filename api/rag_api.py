from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from pymongo import MongoClient
from datetime import datetime
import chromadb
from sentence_transformers import SentenceTransformer
import os

app = Flask(__name__)
CORS(app)

MONGO_URI = "mongodb+srv://hebarsmy:DXGzIfmEUWFltneX@cluster0.41d5z.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(MONGO_URI)
db = client['finance_ai']  
history_collection = db['query_history']  

GROQ_API_KEY = "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"
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


# ChromaDB Setup
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(name="news_data")

# Load Embedding Model
embed_model = SentenceTransformer("all-MiniLM-L6-v2")

# Function to get AI response with RAG
def get_ai_response(query, model):
    pre = "if the query contains keywords related to finance, stock, business, gold, cryptocurrency, or financial insights then provide the answer, otherwise just respond with this message: I can only respond to financial insight related questions."

    try:
        # Generate Query Embedding
        query_embedding = embed_model.encode(query).tolist()
        # Retrieve Relevant Documents from ChromaDB
        results = collection.query(query_embeddings=[query_embedding], n_results=3)
        # If no relevant documents found
        if not results['metadatas'][0]:  
            return "No relevant information found in the database."
        # Prepare Context
        context = "\n".join([f"Date: {doc['date']}\nSummary: {doc['detailed_summary']}" for doc in results['metadatas'][0]])

        # Construct Prompt for LLM
        full_prompt = f"{pre}\n\nRetrieved Documents:\n{context}\n\nUser query: {query}"

        # Select Model for Groq API
        model_mapping = {
            "llama": "llama3-70b-8192",
            "deepseek": "deepseek-r1-distill-llama-70b",
            "chatgpt": "gemma2-9b-it"
        }
        model_name = model_mapping.get(model.lower(), None)

        if not model_name:
            return "This model is currently not supported."

        # Call Groq AI agents
        headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
        payload = {"model": model_name, "messages": [{"role": "user", "content": full_prompt}], "max_tokens": 150, "temperature": 0.7}

        response = requests.post(GROQ_API_URL, headers=headers, json=payload)

        if response.status_code == 200:
            return response.json()['choices'][0]['message']['content'].strip()
        else:
            return f"Groq API Error: {response.status_code} - {response.text}"

    except Exception as e:
        return f"Error from AI service: {str(e)}"

# Save queries and responses to MongoDB
def save_to_history(prompt, response):
    entry = {"query": prompt, "response": response, "timestamp": datetime.utcnow()}
    history_collection.insert_one(entry)

# Flask Routes
@app.route('/', methods=['GET'])
def home():
    return jsonify({'message': 'RAG AI API with MongoDB & ChromaDB is running!'}), 200

@app.route('/ask', methods=['POST'])
def ask_ai():
    data = request.get_json()
    model = data.get('model')
    prompt = data.get('prompt')

    if not model or not prompt:
        return jsonify({'error': 'Please provide both "model" and "prompt"'}), 400

    response = get_ai_response(prompt, model)

    # Save to MongoDB
    save_to_history(prompt, response)

    return jsonify({'response': response}), 200

@app.route('/history', methods=['GET'])
def get_history():
    history = list(history_collection.find({}, {"_id": 0})) 
    return jsonify({'history': history}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)