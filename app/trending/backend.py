from fastapi import FastAPI, Query
import requests
import openai
import chromadb
import os
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv(".env.local")

# Securely fetch API keys
GNEWS_API_KEY = os.environ.get("GNEWS_API_KEY")
NEWS_API_KEY = os.environ.get("NEWS_API_KEY")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

# Initialize OpenAI client
client = None
if OPENAI_API_KEY:
    client = openai.OpenAI(api_key=OPENAI_API_KEY)
else:
    logger.warning("OPENAI_API_KEY not found in environment variables")

# Initialize ChromaDB client
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(name="news_data")

# Initialize embedding model
embed_model = SentenceTransformer("all-MiniLM-L6-v2")

app = FastAPI()

def fetch_gnews(query):
    """Fetch news articles from GNews API"""
    try:
        if not GNEWS_API_KEY:
            logger.error("GNEWS_API_KEY not configured")
            return []
            
        url = f"https://gnews.io/api/v4/search?q={query}&lang=en&max=10&apikey={GNEWS_API_KEY}"
        response = requests.get(url)
        if response.status_code == 200:
            return response.json().get("articles", [])
        else:
            logger.error(f"GNews API error: {response.status_code} - {response.text}")
            return []
    except Exception as e:
        logger.error(f"Error fetching from GNews: {str(e)}")
        return []

def fetch_newsapi(query):
    """Fetch news articles from NewsAPI"""
    try:
        if not NEWS_API_KEY:
            logger.error("NEWS_API_KEY not configured")
            return []
            
        url = f"https://newsapi.org/v2/everything?q={query}&language=en&pageSize=10&apiKey={NEWS_API_KEY}"
        response = requests.get(url)
        if response.status_code == 200:
            return response.json().get("articles", [])
        else:
            logger.error(f"NewsAPI error: {response.status_code} - {response.text}")
            return []
    except Exception as e:
        logger.error(f"Error fetching from NewsAPI: {str(e)}")
        return []

def generate_embedding(text):
    """Generate embeddings using SentenceTransformer"""
    try:
        return embed_model.encode(text).tolist()
    except Exception as e:
        logger.error(f"Error generating embedding: {str(e)}")
        # Fallback to OpenAI embeddings if SentenceTransformer fails
        try:
            if not client:
                logger.error("OpenAI client not initialized - API key missing")
                raise ValueError("OpenAI API key not configured")
                
            response = client.embeddings.create(
                model="text-embedding-ada-002",
                input=text
            )
            return response.data[0].embedding
        except Exception as e2:
            logger.error(f"Error generating OpenAI embedding: {str(e2)}")
            raise

@app.get("/search-news")
def search_news(query: str = Query("finance")):
    """
    Search for news articles and store them in ChromaDB
    """
    try:
        logger.info(f"Searching news for query: {query}")
        
        # Fetch articles from both sources
        gnews_articles = fetch_gnews(query)
        newsapi_articles = fetch_newsapi(query)
        all_articles = gnews_articles + newsapi_articles
        
        logger.info(f"Found {len(all_articles)} articles in total")
        
        # Process and store articles in ChromaDB
        for article in all_articles:
            try:
                # Create a rich text representation
                text = f"{article.get('title', '')} {article.get('description', '')}"
                if not text.strip():
                    continue
                
                # Generate embedding
                embedding = generate_embedding(text)
                
                # Prepare metadata
                metadata = {
                    "title": article.get("title", "Untitled"),
                    "source": article.get("source", {}).get("name", "Unknown"),
                    "date": article.get("publishedAt", "Unknown"),
                    "url": article.get("url", ""),
                    "detailed_summary": article.get("content", article.get("description", "")),
                    "region": "Global"  # Default region
                }
                
                # Detect region from content
                content = (article.get("content", "") or "") + (article.get("description", "") or "")
                regions = {
                    "North America": ["US", "USA", "United States", "Canada", "Mexico"],
                    "Europe": ["EU", "Europe", "UK", "Germany", "France", "Italy", "Spain"],
                    "Asia Pacific": ["China", "Japan", "India", "Australia", "Singapore", "Hong Kong"],
                    "Middle East": ["Saudi", "UAE", "Dubai", "Qatar", "Israel", "Iran"],
                    "Africa": ["Africa", "Nigeria", "Egypt", "South Africa", "Kenya"],
                    "Latin America": ["Brazil", "Argentina", "Chile", "Colombia", "Mexico"]
                }
                
                for region, keywords in regions.items():
                    if any(keyword.lower() in content.lower() for keyword in keywords):
                        metadata["region"] = region
                        break
                
                # Add to ChromaDB
                collection.add(
                    documents=[text],
                    embeddings=[embedding],
                    ids=[article.get("url", str(hash(text)))],
                    metadatas=[metadata]
                )
                logger.info(f"Added article to ChromaDB: {article.get('title', 'Untitled')}")
                
            except Exception as e:
                logger.error(f"Error processing article: {str(e)}")
                continue
        
        return {"articles": all_articles, "count": len(all_articles)}
    
    except Exception as e:
        logger.error(f"Error in search_news: {str(e)}")
        return {"error": str(e), "articles": []}

@app.get("/relevant-news")
def get_relevant_news(query: str, region: str = None):
    """
    Get relevant news articles based on query and optional region
    """
    try:
        logger.info(f"Finding relevant news for query: {query}, region: {region}")
        
        # Generate query embedding
        query_embedding = generate_embedding(query)
        
        # Query ChromaDB with optional region filter
        if region and region != "Global":
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=5,
                where={"region": region}
            )
        else:
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=5
            )
        
        # Process results
        articles = []
        if results["documents"] and results["metadatas"]:
            for i, doc in enumerate(results["documents"][0]):
                if i < len(results["metadatas"][0]):
                    metadata = results["metadatas"][0][i]
                    articles.append({
                        "title": metadata.get("title", "Untitled"),
                        "source": metadata.get("source", "Unknown"),
                        "date": metadata.get("date", "Unknown"),
                        "url": metadata.get("url", ""),
                        "summary": metadata.get("detailed_summary", doc),
                        "region": metadata.get("region", "Global"),
                        "relevance_score": results["distances"][0][i] if "distances" in results else None
                    })
        
        logger.info(f"Found {len(articles)} relevant articles")
        return {"relevant_articles": articles}
    
    except Exception as e:
        logger.error(f"Error in get_relevant_news: {str(e)}")
        return {"error": str(e), "relevant_articles": []}

@app.get("/health")
def health_check():
    """Health check endpoint"""
    try:
        # Check if ChromaDB is accessible
        collection_info = collection.get()
        doc_count = len(collection_info.get('ids', []))
        
        return {
            "status": "healthy",
            "chromadb_status": "connected",
            "document_count": doc_count,
            "embedding_model": "all-MiniLM-L6-v2"
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)