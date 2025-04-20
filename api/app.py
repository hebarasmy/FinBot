import os
import io
import logging
from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import requests
from pymongo import MongoClient
from gridfs import GridFS
from datetime import datetime
import uuid
import time
from openai import OpenAI
import re
import chromadb
from sentence_transformers import SentenceTransformer

from upload import handle_file_upload, extract_text, analyze_financial_content

# Load environment variables
load_dotenv(".env.local")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure upload folder
UPLOAD_FOLDER = "uploads"  
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# MongoDB connection
MONGO_URI = os.environ.get("MONGODB_URI")
if not MONGO_URI:
    logger.warning("MONGODB_URI not found in environment variables")
    # Don't hardcode fallback - exit or use a non-sensitive default
    MONGO_URI = "mongodb://localhost:27017/finance_ai"  # Local fallback for development

client = MongoClient(MONGO_URI)
db = client['finance_ai']

# Collections for storing data
history_collection = db['query_history']
chat_history_collection = db['chat_history']
document_collection = db['documents']
fs = GridFS(db, collection="uploads")

# API keys and endpoints
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if not GROQ_API_KEY:
    logger.warning("GROQ_API_KEY not found in environment variables")
    # No fallback for API keys - they should be in environment variables

GROQ_API_URL = os.environ.get("GROQ_API_URL", "https://api.groq.com/openai/v1/chat/completions")

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    logger.warning("OPENAI_API_KEY not found in environment variables")
    # No fallback for API keys - they should be in environment variables

# Initialize OpenAI client only if API key is available
openai_client = None
if OPENAI_API_KEY:
    openai_client = OpenAI(api_key=OPENAI_API_KEY)

# Initialize ChromaDB and embedding model
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(name="news_data")
embed_model = SentenceTransformer("all-MiniLM-L6-v2")

def clean_response(response_text):
    """
    Remove any thinking tags, internal reasoning, or other system artifacts
    from the response before sending it to the user
    """
    # Remove <Thinking> tags and their contents
    cleaned = re.sub(r'<Thinking>.*?</Thinking>', '', response_text, flags=re.DOTALL)
    
    # Remove any "Let me think about this" or similar phrases
    thinking_phrases = [
        r"Let me think about this\.?",
        r"Let's think through this\.?",
        r"Thinking through this\.?",
        r"I need to reason through this\.?",
        r"Let me analyze this\.?",
        r"Let me break this down\.?",
        r"Let's analyze this step by step\.?",
        r"Let me work through this\.?",
        r"I'll think about this\.?",
        r"Thinking:.*?\n",
        r"Internal reasoning:.*?\n",
        r"Step \d+:.*?\n"
    ]
    
    for phrase in thinking_phrases:
        cleaned = re.sub(phrase, '', cleaned, flags=re.IGNORECASE)
    
    # Fix markdown formatting
    cleaned = re.sub(r'\*\* (.*?) \*\*', r'**\1**', cleaned)
    cleaned = re.sub(r'^\*([^\s])', r'* \1', cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r'^-([^\s])', r'- \1', cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r'^(\d+)\.([^\s])', r'\1. \2', cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r'^(#+)([^\s])', r'\1 \2', cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
    
    return cleaned.strip()

def get_ai_response(prompt, model, include_prefix=True, region=None, document_name=None, document_text=None):
    """
    Enhanced RAG (Retrieval Augmented Generation) implementation
    
    This function:
    1. Embeds the user query
    2. Retrieves relevant documents from ChromaDB
    3. Constructs a prompt with retrieved context
    4. Generates a response with internal reasoning
    """
    region = region if region else "Global"
    
    try:
        logger.info(f"Starting RAG process for query: '{prompt[:50]}...'")
        logger.info(f"Region context: {region}, Model: {model}")
        
        is_document_query = document_name is not None
        
        if is_document_query:
            logger.info(f"Document-specific query for: {document_name}")
            
            if not document_text:
                logger.info(f"Retrieving document text from database for: {document_name}")
                doc = document_collection.find_one({"filename": document_name})
                if doc and "text" in doc:
                    document_text = doc["text"]
                    logger.info(f"Retrieved document text: {len(document_text)} characters")
                else:
                    logger.warning(f"Document text not found in database for: {document_name}")
        
        # Step 1: Generate query embedding
        logger.info("Generating query embedding...")
        query_embedding = embed_model.encode(prompt).tolist()
        logger.info("Query embedding generated successfully")
        
        # Step 2: Retrieve relevant documents from ChromaDB or use the specific document
        if is_document_query and document_text:
            logger.info("Using provided document text instead of ChromaDB retrieval")
            retrieved_context = f"DOCUMENT: {document_name}\n\nContent: {document_text[:5000]}..."
            retrieved_docs = [{"name": document_name, "content": document_text[:5000]}]
        else:
            logger.info("Retrieving relevant documents from ChromaDB...")
            
            # Apply region filter if specified
            if region and region != "Global":
                logger.info(f"Applying region filter: {region}")
                results = collection.query(
                    query_embeddings=[query_embedding], 
                    n_results=5,
                    where={"region": region}
                )
            else:
                logger.info("No region filter applied")
                results = collection.query(
                    query_embeddings=[query_embedding], 
                    n_results=5
                )
            
            # Process retrieved documents
            retrieved_docs = []
            if results['metadatas'][0]:
                retrieved_docs = results['metadatas'][0]
                logger.info(f"Retrieved {len(retrieved_docs)} relevant documents")
                
                for i, doc in enumerate(retrieved_docs):
                    logger.info(f"Doc {i+1}: {doc.get('date', 'N/A')} - {doc.get('source', 'Unknown')}")
                    
                retrieved_context = "\n\n".join([
                    f"DOCUMENT {i+1}:\n"
                    f"Date: {doc.get('date', 'N/A')}\n"
                    f"Source: {doc.get('source', 'Unknown')}\n"
                    f"Region: {doc.get('region', 'Global')}\n"
                    f"Content: {doc.get('detailed_summary', '')}"
                    for i, doc in enumerate(retrieved_docs)
                ])
            else:
                logger.info("No relevant documents found in ChromaDB")
                retrieved_context = "No relevant documents were retrieved from the knowledge base."
        
        # Step 3: Construct the prompt with internal reasoning instructions
        logger.info("Constructing prompt with internal reasoning instructions...")
        
        # System message to guide the model's behavior
        system_message = f"""You are a financial insights assistant specializing in the {region} region.
Your task is to provide accurate, helpful information based on retrieved documents and your knowledge.

IMPORTANT: You must use internal reasoning to analyze the query and formulate your response.
This means you should:
1. Analyze what the user is asking
2. Consider the relevant information from retrieved documents
3. Reason through the best way to answer
4. Provide only your final, polished response

FORMATTING INSTRUCTIONS:
- Use proper markdown formatting for your response
- For bold text, use **bold text** format (not ** bold text **)
- For bullet points, use proper markdown: "- Point 1" with a space after the dash
- For numbered lists, use: "1. First item" with a space after the number
- For headings, use: "## Heading" with a space after the #
- Ensure there are no spaces between the asterisks and the text for bold/italic formatting

DO NOT share your internal reasoning process with the user. They should only see your final answer.
DO NOT use <Thinking> or <Think> tags in your response.
DO NOT include phrases like "Let me think about this" or "Analyzing this step by step".
DO NOT number your reasoning steps or include any meta-commentary about your thinking process.
"""
        
        # User message containing the context and query
        user_message = f"""USER QUERY: {prompt}

RETRIEVED CONTEXT:
{retrieved_context}

INSTRUCTIONS:
1. First, internally analyze what information from the retrieved documents is relevant to the query.
2. If the retrieved documents don't contain relevant information, use your general knowledge.
3. Format your response with bullet points for clarity where appropriate.
4. Focus exclusively on financial insights{' relevant to the ' + region + ' region' if region != 'Global' else ''}.
5. Keep your response concise and directly address the user's query.
6. DO NOT mention that you're using retrieved documents or reference this prompt.
7. DO NOT include any thinking tags, reasoning steps, or internal analysis in your final response.
"""
        
        logger.info(f"Prompt constructed. Length: {len(user_message)} characters")
        
        # Step 4: Generate response using the appropriate model
        logger.info(f"Generating response using model: {model}...")
        
        if model.lower() == "chatgpt":
            # Use OpenAI API with gpt4omini model
            logger.info("Using OpenAI API with gpt-4o-mini model")
            try:
                if not openai_client:
                    return "Error: OpenAI API key not configured. Please set the OPENAI_API_KEY environment variable."
                
                response = openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_message},
                        {"role": "user", "content": user_message}
                    ],
                    temperature=0.7,
                    max_tokens=800
                )
                response_text = response.choices[0].message.content
                logger.info("Response generated successfully with OpenAI")
                logger.info(f"Response preview: {response_text[:100]}...")
                
                # Clean the response before returning
                cleaned_response = clean_response(response_text)
                return cleaned_response
                
            except Exception as e:
                error_msg = f"OpenAI API Error: {str(e)}"
                logger.error(error_msg)
                return error_msg
        elif model.lower() in ['llama', 'deepseek']:
            # Use Groq API for llama and deepseek models
            if not GROQ_API_KEY:
                return "Error: Groq API key not configured. Please set the GROQ_API_KEY environment variable."
                
            headers = {
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            }
            
            # Select the appropriate model
            if model.lower() == "llama":
                m = "llama3-70b-8192"  
            else:  # deepseek
                m = "deepseek-r1-distill-llama-70b"
                
            logger.info(f"Using Groq API with model: {m}")
            
            # Call the Groq API
            payload = {
                "model": m,
                "messages": [
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_message}
                ],
                "max_tokens": 800,
                "temperature": 0.7
            }
            
            response = requests.post(GROQ_API_URL, headers=headers, json=payload)
            
            if response.status_code == 200:
                response_text = response.json()['choices'][0]['message']['content'].strip()
                logger.info("Response generated successfully with Groq")
                logger.info(f"Response preview: {response_text[:100]}...")
                
                # Clean the response before returning
                cleaned_response = clean_response(response_text)
                return cleaned_response
                
            else:
                error_msg = f"Groq API Error: {response.status_code} - {response.text}"
                logger.error(error_msg)
                return error_msg
        else:
            error_msg = f"Unsupported model: {model}"
            logger.error(error_msg)
            return error_msg
    except Exception as e:
        error_msg = f"Error in RAG process: {str(e)}"
        logger.error(error_msg)
        return f"Error from AI service: {str(e)}"

def save_to_history(prompt, response, region=None, user_id="anonymous", model="chatgpt"):
    """Save the chat to history collection"""
    region = region or "Global" 
    
    # Clean the response one more time before saving to history
    cleaned_response = clean_response(response)
    
    entry = {
        "id": str(uuid.uuid4()),
        "userId": user_id,
        "title": prompt[:50] + ("..." if len(prompt) > 50 else ""),
        "messages": [
            {
                "id": f"msg-{int(time.time() * 1000)}-user",
                "role": "user",
                "content": prompt,
                "timestamp": datetime.utcnow().isoformat()
            },
            {
                "id": f"msg-{int(time.time() * 1000)}-assistant",
                "role": "assistant",
                "content": cleaned_response,
                "timestamp": datetime.utcnow().isoformat(),
                "model": model,
                "region": region
            }
        ],
        "model": model,
        "region": region,
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat()
    }
    chat_history_collection.insert_one(entry)
    return entry["id"]

# API Routes
@app.route('/', methods=['GET'])
def home():
    return jsonify({'message': 'AI API server with MongoDB integration is running!'}), 200

@app.route('/ask', methods=['POST'])
def ask_ai():
    """Handle search queries with RAG"""
    data = request.get_json()
    model = data.get('model')
    prompt = data.get('prompt')
    region = data.get('region', 'Global')
    user_id = data.get('userId', 'user')
    
    if not model or not prompt:
        return jsonify({'error': 'Please provide both "model" and "prompt"'}), 400
    
    is_document_follow_up = data.get('isDocumentFollowUp', False)
    document_name = data.get('documentName')
    
    is_meta_query = data.get('isMetaQuery', False)
    
    if is_document_follow_up and document_name:
        logger.info(f"Processing document follow-up question about: {document_name}")
        
        document_text = None
        doc = document_collection.find_one({"filename": document_name})
        if doc and "text" in doc:
            document_text = doc["text"]
            logger.info(f"Retrieved document text: {len(document_text)} characters")
        else:
            logger.warning(f"Document text not found in database for: {document_name}")
        
        response = get_ai_response(
            prompt=prompt, 
            model=model, 
            region=region, 
            document_name=document_name,
            document_text=document_text
        )
    elif is_meta_query:
        logger.info(f"Processing meta-query about the search engine")
        # For meta-queries, we don't need RAG, just answer directly about the system
        system_message = """You are a helpful assistant explaining how the financial search engine works.
Provide clear, concise explanations about the system's functionality, features, and capabilities.

IMPORTANT: DO NOT use <Thinking> or <Thinking> tags in your response.
DO NOT include phrases like "Let me think about this" or "Analyzing this step by step".
DO NOT number your reasoning steps or include any meta-commentary about your thinking process.
"""
        
        user_message = f"""The user is asking about the search engine itself, not about financial information.
Please answer their question about the system:

USER QUERY: {prompt}

Provide a helpful response about the search engine's functionality."""
        
        try:
            logger.info("Using OpenAI for meta-query")
            if not openai_client:
                return jsonify({'response': "Error: OpenAI API key not configured. Please set the OPENAI_API_KEY environment variable.", 'chatId': None}), 500
                
            response_obj = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_message}
                ],
                max_tokens=500,
                temperature=0.7
            )
            response = response_obj.choices[0].message.content
            
            response = clean_response(response)
            
        except Exception as e:
            logger.error(f"Error processing meta-query: {str(e)}")
            response = f"Error: Unable to process your query about the search engine."
    else:
        logger.info(f"Processing regular search query with RAG")
        response = get_ai_response(prompt, model, include_prefix=True, region=region)
    
    chat_id = save_to_history(prompt, response, region, user_id, model)
    return jsonify({'response': response, 'chatId': chat_id}), 200

@app.route('/chat-history', methods=['GET'])
def get_chat_sessions():
    """Get chat history for a user"""
    try:
        user_id = request.args.get('userId', 'user')
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400

        chat_sessions = list(chat_history_collection.find({'userId': user_id}, {'_id': 0}))
        return jsonify({'history': chat_sessions}), 200
    except Exception as e:
        logger.error(f"Error retrieving chat history: {str(e)}")
        return jsonify({'error': f"Failed to retrieve history: {str(e)}"}), 500

@app.route('/history', methods=['GET'])
def get_history():
    """Get search history for a user"""
    try:
        user_id = request.args.get('userId', 'user')
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        history = list(history_collection.find({"userId": user_id}, {"_id": 0}))
        return jsonify({'history': history}), 200
    except Exception as e:
        logger.error(f"Error fetching history: {str(e)}")
        return jsonify({'error': f"Failed to fetch history: {str(e)}"}), 500

@app.route("/history/<chat_id>", methods=["DELETE"])
def delete_history(chat_id):
    """Delete a chat from history"""
    try:
        user_id = request.args.get('userId', 'user')
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        # Delete from both collections to ensure complete removal
        history_result = history_collection.delete_one({"id": chat_id, "userId": user_id})
        chat_result = chat_history_collection.delete_one({"id": chat_id, "userId": user_id})
        
        if history_result.deleted_count == 0 and chat_result.deleted_count == 0:
            return jsonify({"error": "Chat not found or not authorized"}), 404
            
        return jsonify({"success": True, "message": "Chat deleted successfully"}), 200
    except Exception as e:
        logger.error(f"Error deleting chat: {str(e)}")
        return jsonify({"error": f"Failed to delete chat: {str(e)}"}), 500
    
@app.route('/me', methods=['GET'])
def get_current_user():
    """Get current user information"""
    user_id = request.args.get('userId', 'user')
    return jsonify({"userId": user_id})

@app.route("/upload", methods=["POST"])
def upload_file():
    """Handle document upload - delegates to upload.py"""
    return handle_file_upload(request, fs, document_collection, save_to_history)

@app.route("/document/<filename>", methods=["GET"])
def get_document_text(filename):
    """Retrieve document text from the database"""
    try:
        user_id = request.args.get('userId', 'user')
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
            
        doc = document_collection.find_one({"filename": filename})
        if not doc:
            return jsonify({"error": "Document not found"}), 404
            
        return jsonify({
            "filename": doc["filename"],
            "upload_date": doc.get("upload_date", "Unknown"),
            "text_preview": doc["text"][:500] + "..." if len(doc["text"]) > 500 else doc["text"],
            "text_length": len(doc["text"])
        }), 200
    except Exception as e:
        logger.error(f"Error retrieving document: {str(e)}")
        return jsonify({"error": f"Failed to retrieve document: {str(e)}"}), 500

@app.route("/uploads/<filename>")
def uploaded_file(filename):
    """Serve uploaded files"""
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    # Check if RAG verification is requested
    check_rag = request.args.get('check_rag', 'false').lower() == 'true'
    check_upload = request.args.get('check_upload', 'false').lower() == 'true'
    
    response = {"status": "healthy", "api": "running"}
    
    if check_rag:
        try:
            # Check if ChromaDB collection exists and has documents
            collection_info = collection.get()
            doc_count = len(collection_info.get('ids', []))
            
            response["rag"] = {
                "status": "healthy" if doc_count > 0 else "warning",
                "message": "RAG setup is working properly" if doc_count > 0 else "ChromaDB collection exists but contains no documents",
                "collection_name": "news_data",
                "document_count": doc_count
            }
        except Exception as e:
            response["rag"] = {
                "status": "error",
                "message": f"Failed to verify RAG setup: {str(e)}"
            }
    
    if check_upload:
        try:
            fs_files = db.fs.files.count_documents({})
            
            doc_count = document_collection.count_documents({})
            
            response["upload"] = {
                "status": "healthy",
                "message": "Document upload system is operational",
                "gridfs_files": fs_files,
                "document_count": doc_count
            }
        except Exception as e:
            response["upload"] = {
                "status": "error",
                "message": f"Failed to verify upload system: {str(e)}"
            }
    
    return jsonify(response)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)