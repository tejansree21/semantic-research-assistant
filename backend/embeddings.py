import cohere
import os
from typing import List

def get_cohere_client():
    """Initialize Cohere client."""
    api_key = os.getenv("COHERE_API_KEY")
    if not api_key:
        raise ValueError("COHERE_API_KEY not set in environment")
    return cohere.ClientV2(api_key)

def embed_documents(texts: List[str]) -> List[List[float]]:
    """
    Embed document chunks using Cohere's embed model.
    
    Uses input_type="search_document" for documents being stored.
    This tells Cohere to optimize embeddings for retrieval.
    """
    co = get_cohere_client()
    
    # Cohere has a batch limit of 96 texts per call
    all_embeddings = []
    batch_size = 96
    
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        response = co.embed(
            texts=batch,
            model="embed-english-v3.0",
            input_type="search_document",
            embedding_types=["float"]
        )
        all_embeddings.extend(response.embeddings.float)
    
    return all_embeddings

def embed_query(query: str) -> List[float]:
    """
    Embed a search query using Cohere's embed model.
    
    Uses input_type="search_query" — different from documents!
    Cohere trains asymmetric embeddings: queries and documents
    are embedded differently for better retrieval.
    """
    co = get_cohere_client()
    response = co.embed(
        texts=[query],
        model="embed-english-v3.0",
        input_type="search_query",
        embedding_types=["float"]
    )
    return response.embeddings.float[0]