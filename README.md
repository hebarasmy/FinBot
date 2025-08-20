# Fin-Bot Backend  
*A Unified, Intelligent, and Personalized Platform for Financial News Retrieval, Summarization, and Contextualized AI Responses*  

![Python](https://img.shields.io/badge/Python-3.8%2B-blue)  
![Flask](https://img.shields.io/badge/Flask-API-green)  
![MongoDB](https://img.shields.io/badge/Database-MongoDB-brightgreen)  
![ChromaDB](https://img.shields.io/badge/VectorDB-ChromaDB-orange)  
![License](https://img.shields.io/badge/License-MIT-lightgrey)  

---

## 📖 Overview  
**Fin-Bot** is a next-generation **financial insights platform** that unifies retrieval, summarization, and contextualized AI responses into a single backend API.  

Unlike generic AI chatbots, Fin-Bot delivers **grounded, region-specific, and contextually aware financial insights** by combining **vector search, large language models (LLMs), and fine-tuned summarization techniques**.  

The system also features the **Mirror Financial Summarizer**, which automatically ingests, analyzes, and summarizes complex financial reports into structured insights — making financial decision-making faster and more reliable.  

---

## ✨ Core Features  
- 🔍 **Personalized Regional Search** – Filter financial data by country, region, or industry.  
- 📊 **ChromaDB Semantic Search** – Contextual vector search for relevant results.  
- 🤖 **Retrieval-Augmented Generation (RAG)** – Fact-grounded answers, minimizing hallucinations.  
- 🪞 **Mirror Financial Summarizer** – Multi-level summaries of financial reports:  
  - Executive overview  
  - Key performance metrics  
  - Risk and compliance highlights  
  - Forward-looking insights  
- 📂 **Multi-Format Document Upload** – Process PDFs, DOCX, and TXT files.  
- 💾 **MongoDB-Integrated Chat History** – Persistent, per-user query and document storage.  
- 🔗 **Multi-Model LLM Support** – Integrates OpenAI GPT-4o, Groq LPUs, and SentenceTransformers.  

---

## 🏗️ Technical Architecture  

### Backend  
- **Flask** → Main API server  
- **ChromaDB** → Vector database for semantic retrieval  
- **SentenceTransformer** → Embedding generator for financial text  
- **OpenAI / Groq APIs** → LLM providers for summarization & contextual responses  
- **pdfplumber / python-docx** → Text extraction from reports  

### Database Layer  
- **MongoDB Atlas**  
  - Stores documents & metadata  
  - Saves vector embeddings for retrieval  
  - Tracks user chat history & uploaded files  

### Frontend (Mirror Summarizer UI)  
- **Next.js + React + TailwindCSS**  
- Interactive dashboards for summaries  
- File upload, visualization, and layered financial analysis  

---

## 🚀 Key Innovations  
- **Granular Summarization Pipelines** – Different summaries for investors, researchers, and students.  
- **Dynamic Retrieval Ranking** – Weighted IoU (WIoU) and contextual chunk ranking for finance.  
- **Personalization Layer** – Tailors summaries to user history, region, and financial goals.  
- **Mirror Summarizer Module** – Cross-document comparisons (e.g., 2022 vs. 2023 reports).  

---

## 💼 Example Use Cases  
- 📈 **Investor Briefings** → Summarize quarterly earnings into KPIs.  
- 🔎 **Market Researchers** → Compare insights across reports and regions.  
- 🎓 **Students & Academics** → Generate structured summaries of textbooks or datasets.  
- 🏢 **Corporate Users** → Summarize internal docs into decision-ready insights.  

---

## ⚙️ Setup Instructions  

### Prerequisites  
- Python 3.8+  
- MongoDB Atlas (or local MongoDB instance)  
- Node.js (for frontend)  

### Installation  

```bash
# Clone repository
git clone https://github.com/yourusername/finbot.git
cd finbot

# Create Python environment
python3 -m venv venv
source venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Setup frontend
cd frontend
npm install
Running the Backend
bash
Copy
Edit
cd backend
python app.py
Running the Frontend
bash
Copy
Edit
cd frontend
npm run dev
