# 🔐 Unified InfoSec QnA Assistant

A full-stack RAG based AI-powered system to help InfoSec teams efficiently handle security questionnaires and ad-hoc compliance queries using a unified knowledge base.

---

## Problem Statement

Security and compliance teams need faster, smarter tools to:
1. **Batch Mode** – Automatically suggest answers (with confidence and citations) to uploaded questionnaires.
2. **Conversational Mode** – Respond to ad-hoc security/compliance questions via chat, referencing internal policies and knowledge sources.

This project uses **Next.js (frontend)**, **Django (backend)**, and **LLMs with FAISS-based hybrid retrieval** to meet those needs.

---

## Features

- **Hybrid Semantic Search** using HuggingFace Embeddings + FAISS over CSV (QnA pairs) and PDF (policies).
-  **Batch Mode**: Upload a questionnaire, get suggested answers with confidence scores and citations.
- **Conversational Mode**: Real-time chat to ask compliance questions, get brief, reference-backed answers.
- **Unified Knowledge Base** powering both modes (KL, documents, policies).
- **LLM-Driven Answering** using context-aware prompts tailored by source type (CSV vs PDF).

---

## 🛠️ Tech Stack

- **Frontend**: Next.js (TypeScript, Tailwind, React Query)
- **Backend**: Django (REST API)
- **Vector Search**: FAISS + SentenceTransformers (`all-MiniLM-L6-v2`)
- **LLM Interface**: Ollama (`llama3.2:latest`) via LangChain

---
### Start Backend
```bash
cd Backend
pip install -r requirements.txt
cd Backend
python manage.py runserver 8080
```

### Start Frontend 
```bash
cd Frontend
npm run dev
```

### Note: 
For system to work properly you myst have installed OLLAMA 3.2 locally

#### SecurityPal Hackathon Winning Project 😉 

---

## Demo Video
[Click Here](https://youtu.be/-T9_mN8g5aE)
