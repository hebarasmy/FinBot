<<<<<<< HEAD

Fin-Bot Backend
A unified, efficient, and personalized financial news retrieval and contextualized response generation API.

Overview
Fin-Bot is a financial insights platform that provides:
- Personalized regional search for localized financial insights
- ChromaDB-powered vector search for contextual accuracy
- Retrieval-Augmented Generation (RAG) for grounded AI responses
- Multi-source document analysis via PDF/DOCX/TXT upload support
- MongoDB integration for chat history and document storage

Technical Stack:
- Flask: Main API server
- ChromaDB: Vector database for similarity search
- SentenceTransformer: Text embedding generation
- OpenAI/Groq: LLM providers for text generation
- MongoDB: Document and chat history storage
- pdfplumber/python-docx: Document text extraction

Setup Instructions
 Prerequisites
   - Python 3.8+
   - MongoDB
   - Node.js (for the frontend)

Installation
Clone the repository:
git clone https://github.com/yourusername/finbot.git
cd finbot
