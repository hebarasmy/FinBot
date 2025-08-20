# Fin-Bot — RAG-Powered Financial Insight Platform

Fin-Bot is a full-stack web platform that delivers **personalized, context-aware financial insights** by combining **semantic search (SentenceTransformers + ChromaDB)** with **RAG-augmented LLMs**. The system supports real-time financial widgets, user document uploads (PDF/DOCX/TXT), and multi-model LLM selection (GPT-4o-mini, LLaMA-3-70B, DeepSeek-R1).

---

## 📖 Overview

Fin-Bot integrates semantic search, document summarization, and user-driven model selection into a single interface, eliminating the need to juggle multiple tools for financial research. User profiles live in **MongoDB**, while semantic embeddings are indexed in **ChromaDB** for fast vector retrieval.

---

## ✨ Features

- **RAG-grounded answers** over a finance corpus using SentenceTransformers (`all-MiniLM-L6-v2`) and ChromaDB.
- **Vector retrieval** with cosine similarity and **top-k (k=3)** selection for optimal context.
- **Multi-model LLM selection**: GPT-4o mini, LLaMA-3-70B, DeepSeek-R1.
- **User uploads** (PDF/DOCX/TXT), text extraction (pdfplumber, python-docx), and structured financial summaries.
- **Personalization** via region-filtered retrieval (metadata filtering in ChromaDB).
- **Real-time homepage widgets** (Stocks, Crypto, Market Overview) + Trending News via NewsAPI.
- **React + TailwindCSS** frontend; **Flask** API backend; **FastAPI** supplemental microservice.
- **MongoDB Atlas** for users/sessions/chat history with **GridFS** for uploads; **ChromaDB** for vectors.

---

## 🏗️ Architecture

- **Frontend**: React, TailwindCSS  
- **Backend**: Flask (core routes) + FastAPI (news/trending services)  
- **Databases**:  
  - MongoDB Atlas: user accounts, sessions, chat history, file storage (GridFS)  
  - ChromaDB: semantic vectors & metadata  
  - SQLite: staging/local testing  
- **Models**: GPT-4o mini, LLaMA-3-70B, DeepSeek-R1

---

## 🔎 RAG Pipeline

1. **Ingestion & Embedding**: Kaggle finance dataset cleaned and embedded with `all-MiniLM-L6-v2` (384-dim). Stored in ChromaDB.
2. **Retrieval**: User query embedded → cosine similarity search → top-k=3 results.
3. **Augmentation & Generation**: Query + retrieved docs passed to chosen LLM.
4. **Response Cleaning**: Outputs sanitized (regex) before returning.
5. **Personalization**: Region metadata filter applied at retrieval.

---

## 🤖 AI Agents

Fin-Bot orchestrates three specialized AI agents:

1. **Retriever Agent** – Fetches top-k relevant passages using embeddings + ChromaDB.  
2. **Summarizer Agent** – Produces structured summaries (Executive, KPIs, Risks, Outlook).  
3. **Contextual Answering Agent** – Generates grounded conversational responses with RAG context.  

---

📂 Data Stores

MongoDB Atlas

Users, sessions, query/chat history

GridFS for file uploads

ChromaDB

Vector embeddings + finance metadata

SQLite

Lightweight local staging DB for ingestion/testing

🧠 AI Models

LLaMA-3-70B-8192 → Long-context reasoning

DeepSeek-R1 Distill LLaMA-70B → Fast, cost-efficient

GPT-4o mini → Low-latency, concise finance answers

📡 Real-Time Data

Widgets: Stocks, Cryptocurrency, Market Overview

NewsAPI: Trending finance news (latest 8h)

📑 Document Upload & Summarization

Supports PDF, DOCX, TXT (up to 10MB)

Extracted with pdfplumber / python-docx

Summarized with GPT-4o mini into:

Executive summary

Key metrics

Segments

Risks

Saved into MongoDB (history + file storage)

🔐 Authentication & Security

Email verification with SendGrid

Password hashing via bcrypt

HTTP-only session cookies (7 days)

Time-limited verification codes (15 min)

Middleware-protected routes

⚙️ Setup
Prerequisites

Python 3.10+

Node.js

MongoDB Atlas account

API keys: OpenAI, Groq, NewsAPI, SendGrid

# backend
pip install -r requirements.txt

# frontend
cd web && npm install

# run backend
python app.py

# run frontend
cd web && npm run dev

🧪 Testing

Unit tests with pytest covering:

File parsing

MongoDB integration

Embedding generation

Response cleaning

📌 Roadmap

 Extend personalization (multi-factor filters)

 Add multilingual summarization (Arabic, Chinese, French)

 Bloomberg/Reuters API integration

 Deeper evaluation of agent orchestration



🙌 Acknowledgements

SentenceTransformers → embeddings

ChromaDB → semantic retrieval

MongoDB Atlas + SQLite → storage solutions

OpenAI & Groq → LLM integration

NewsAPI → real-time news feed
