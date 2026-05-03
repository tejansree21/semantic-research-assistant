from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import os
import tempfile
import shutil

from ingestion import process_document
from retrieval import store_chunks, search, clear_collection, get_document_count
from generation import generate_answer

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload")
async def upload_documents(files: List[UploadFile] = File(...)):
    """Upload and process documents."""
    total_chunks = 0
    processed_files = []
    
    for file in files:
        # Save to temp file
        ext = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        try:
            # Process: extract text → chunk
            chunks = process_document(tmp_path, file.filename)
            
            # Store in vector DB
            num_stored = store_chunks(chunks)
            total_chunks += num_stored
            processed_files.append({
                "filename": file.filename,
                "chunks": num_stored
            })
        finally:
            os.unlink(tmp_path)
    
    return {
        "message": f"Processed {len(processed_files)} file(s), created {total_chunks} chunks",
        "files": processed_files,
        "total_chunks_in_db": get_document_count()
    }

@app.post("/ask")
async def ask_question(question: str = Form(...)):
    """Ask a question about uploaded documents."""
    # Check if documents exist
    if get_document_count() == 0:
        return {
            "answer": "No documents uploaded yet. Please upload documents first.",
            "sources": [],
            "num_chunks_used": 0,
            "context_chunks": []
        }
    
    # Step 1: Retrieve relevant chunks
    relevant_chunks = search(question, top_k=5)
    
    # Step 2: Generate answer with context
    result = generate_answer(question, relevant_chunks)
    
    return result

@app.post("/clear")
async def clear_documents():
    """Clear all uploaded documents."""
    clear_collection()
    return {"message": "All documents cleared"}

@app.get("/status")
async def get_status():
    """Get current document count."""
    return {"total_chunks": get_document_count()}