#dataset from kaggle has been vectorized within the chromadb database
import pandas as pd
import chromadb
from sentence_transformers import SentenceTransformer

# Load Dataset
df = pd.read_csv("dataset.csv")  

# Fill missing values with empty strings
df = df.fillna("")

# Ensure 'CompactedSummary' column is of type string
df["CompactedSummary"] = df["CompactedSummary"].astype(str)
# Initialize ChromaDB client
chroma_client = chromadb.PersistentClient(path="./chroma_db")  # Persistent storage
# Create Collection
collection = chroma_client.get_or_create_collection(name="news_data")
# Load Embedding Model
embed_model = SentenceTransformer("all-MiniLM-L6-v2")  

for index, row in df.iterrows():
    doc_id = str(index)
    text = row["CompactedSummary"]

    # Skip empty strings
    if not text.strip():
        continue  

    metadata = {
        "date": row.get("Date", ""),  # Using .get() to avoid KeyErrors
        "subject": row.get("Subject", ""),
        "detailed_summary": row.get("DetailedSummary", ""),
        "impact": row.get("Impact", ""),
    }
    
    # Generate Embedding
    embedding = embed_model.encode(text).tolist()
    
    # Add to ChromaDB
    collection.add(ids=[doc_id], embeddings=[embedding], metadatas=[metadata])

print("Dataset Indexed Successfully!")