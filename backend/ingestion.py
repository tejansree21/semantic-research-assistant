import os
from PyPDF2 import PdfReader
from typing import List

def extract_text_from_pdf(file_path: str) -> str:
    """Extract all text from a PDF file."""
    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    return text

def extract_text_from_txt(file_path: str) -> str:
    """Read text from a .txt file."""
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()

def extract_text(file_path: str) -> str:
    """Extract text from PDF or TXT file."""
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext == ".txt":
        return extract_text_from_txt(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[dict]:
    """
    Split text into overlapping chunks.
    
    Why chunking?
    - LLMs have context limits — we can't send entire documents
    - Smaller chunks = more precise retrieval
    - Overlap ensures we don't lose context at chunk boundaries
    
    Args:
        text: full document text
        chunk_size: number of words per chunk
        overlap: number of overlapping words between chunks
    
    Returns:
        List of dicts with 'text' and 'metadata'
    """
    words = text.split()
    chunks = []
    
    if len(words) == 0:
        return chunks
    
    start = 0
    chunk_id = 0
    
    while start < len(words):
        end = start + chunk_size
        chunk_text = " ".join(words[start:end])
        
        chunks.append({
            "id": f"chunk_{chunk_id}",
            "text": chunk_text,
            "start_word": start,
            "end_word": min(end, len(words)),
            "word_count": len(chunk_text.split())
        })
        
        chunk_id += 1
        start += chunk_size - overlap
    
    return chunks

def process_document(file_path: str, filename: str) -> List[dict]:
    """
    Full pipeline: extract text → chunk → return with metadata.
    """
    text = extract_text(file_path)
    chunks = chunk_text(text)
    
    # Add filename to each chunk's metadata
    for chunk in chunks:
        chunk["source"] = filename
    
    return chunks