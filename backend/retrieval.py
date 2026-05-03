import chromadb
from typing import List, Optional
from embeddings import embed_documents, embed_query

# Global ChromaDB client and collection
chroma_client = chromadb.Client()
collection = None

def get_or_create_collection(name: str = "research_docs"):
    """Get or create a ChromaDB collection."""
    global collection
    collection = chroma_client.get_or_create_collection(
        name=name,
        metadata={"hnsw:space": "cosine"}
    )
    return collection

def store_chunks(chunks: List[dict]):
    """
    Embed chunks and store them in ChromaDB.
    
    ChromaDB stores:
    - ids: unique identifier for each chunk
    - documents: the actual text
    - embeddings: vector representation from Cohere
    - metadatas: source filename and position info
    """
    coll = get_or_create_collection()
    
    texts = [c["text"] for c in chunks]
    ids = [f"{c['source']}_{c['id']}" for c in chunks]
    metadatas = [{"source": c["source"], "start_word": c["start_word"], 
                  "end_word": c["end_word"]} for c in chunks]
    
    # Embed all chunks
    embeddings = embed_documents(texts)
    
    # Store in ChromaDB
    coll.add(
        ids=ids,
        documents=texts,
        embeddings=embeddings,
        metadatas=metadatas
    )
    
    return len(chunks)

def search(query: str, top_k: int = 5) -> List[dict]:
    """
    Semantic search: embed the query and find most similar chunks.
    
    Returns top_k most relevant chunks with their similarity scores.
    """
    coll = get_or_create_collection()
    
    if coll.count() == 0:
        return []
    
    query_embedding = embed_query(query)
    
    results = coll.query(
        query_embeddings=[query_embedding],
        n_results=min(top_k, coll.count())
    )
    
    # Format results
    formatted = []
    for i in range(len(results["ids"][0])):
        formatted.append({
            "id": results["ids"][0][i],
            "text": results["documents"][0][i],
            "source": results["metadatas"][0][i]["source"],
            "distance": results["distances"][0][i] if results["distances"] else None
        })
    
    return formatted

def clear_collection():
    """Delete all documents from the collection."""
    global collection
    chroma_client.delete_collection("research_docs")
    collection = None
    get_or_create_collection()

def get_document_count() -> int:
    """Get total number of chunks stored."""
    coll = get_or_create_collection()
    return coll.count()