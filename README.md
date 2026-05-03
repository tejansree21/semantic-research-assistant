# Semantic Research Assistant

A RAG (Retrieval Augmented Generation) application that lets you upload documents, ask questions in plain English, and get accurate answers with source citations — powered by Cohere's embedding and generation models.

Upload PDFs or text files → documents get chunked and embedded → ask a question → semantic search finds relevant passages → Cohere generates a grounded answer citing exactly which documents the information came from.

## How It Works

```
User uploads documents (PDF/TXT)
        ↓
Text extraction + chunking (500-word overlapping chunks)
        ↓
Cohere Embed v3 generates vector embeddings
        ↓
Embeddings stored in ChromaDB (vector database)
        ↓
User asks a question
        ↓
Question embedded with Cohere Embed v3 (asymmetric search)
        ↓
ChromaDB finds top 5 most similar chunks
        ↓
Chunks + question sent to Cohere Command model
        ↓
Model generates answer with source citations
```

### Why Asymmetric Embeddings Matter

Cohere's Embed model uses different embedding modes for documents (`search_document`) and queries (`search_query`). This is not a shortcut — documents and questions are fundamentally different types of text, and encoding them differently produces better retrieval results than treating them the same way.

## Features

- Upload multiple PDF and TXT files simultaneously
- Automatic text extraction, chunking with overlap, and embedding
- Semantic search using Cohere Embed v3 with asymmetric embeddings
- Answer generation grounded in retrieved context with source citations
- Sources tab showing exactly which document passages were used
- Chat history tracking all questions and answers in a session
- Clear all documents and start fresh

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** FastAPI (Python)
- **Embeddings:** Cohere Embed English v3.0
- **Generation:** Cohere Command R7B
- **Vector Database:** ChromaDB (in-memory)
- **Document Processing:** PyPDF2 (PDF extraction), custom chunking
- **Deployment:** Vercel (frontend)

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- Cohere API key ([dashboard.cohere.com](https://dashboard.cohere.com/api-keys))

### Setup

1. Clone the repo
```bash
git clone https://github.com/tejansree21/semantic-research-assistant.git
cd semantic-research-assistant
```

2. Backend setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

3. Create `backend/.env`
```
COHERE_API_KEY=your_cohere_api_key_here
```

4. Start the backend
```bash
python -m uvicorn app:app --reload
```

5. Frontend setup (new terminal)
```bash
cd frontend
npm install
npm run dev
```

6. Open http://localhost:5173, upload documents, and start asking questions

## Architecture

```
frontend/              → React + Vite UI
backend/
├── app.py             → FastAPI server (upload, ask, clear, status endpoints)
├── ingestion.py       → PDF/TXT text extraction + chunking pipeline
├── embeddings.py      → Cohere Embed API integration (document + query)
├── retrieval.py       → ChromaDB vector storage + semantic search
├── generation.py      → Cohere Command RAG generation with citations
└── requirements.txt
```

## Example Questions

Upload any research paper, report, or document and ask:

- "What are the main findings of this study?"
- "How does the author define X?"
- "What methodology was used?"
- "Summarize the key recommendations"
- "What are the limitations mentioned in the paper?"

## RAG Pipeline Details

| Stage | Component | Details |
|-------|-----------|---------|
| Extraction | PyPDF2 / text reader | Handles PDF and TXT files |
| Chunking | Custom splitter | 500-word chunks with 50-word overlap |
| Embedding | Cohere Embed v3 | 1024-dimensional vectors, asymmetric search |
| Storage | ChromaDB | In-memory vector store with cosine similarity |
| Retrieval | Semantic search | Top 5 most relevant chunks per query |
| Generation | Cohere Command R7B | Grounded answer generation with source citations |

## Limitations

- ChromaDB runs in-memory — data is lost when the backend restarts
- Cohere trial API key has rate limits (20 calls for trial, 1000/month for production)
- PDF extraction depends on text-based PDFs — scanned/image PDFs won't work without OCR
- Chunk size is fixed at 500 words — some documents may benefit from different sizes

## Built By

**Tejan Sree** — [LinkedIn](https://www.linkedin.com/in/tejan-challa)

## License

MIT
