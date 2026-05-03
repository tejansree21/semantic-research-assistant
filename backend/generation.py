import os
import cohere
from typing import List

def generate_answer(query: str, context_chunks: List[dict]) -> dict:
    """
    Generate an answer using Cohere Command with retrieved context.
    
    This is the RAG (Retrieval Augmented Generation) step:
    1. We already retrieved relevant chunks (retrieval)
    2. Now we feed them as context to the LLM (augmented generation)
    3. The model generates an answer grounded in the provided sources
    """
    co = cohere.ClientV2(os.getenv("COHERE_API_KEY"))
    
    # Build context string with source labels
    context_parts = []
    sources = []
    for i, chunk in enumerate(context_chunks):
        source_label = f"[Source: {chunk['source']}]"
        context_parts.append(f"{source_label}\n{chunk['text']}")
        if chunk["source"] not in sources:
            sources.append(chunk["source"])
    
    context_string = "\n\n---\n\n".join(context_parts)
    
    # System prompt that instructs the model to use sources
    system_message = """You are a research assistant that answers questions based on provided document excerpts.

Rules:
1. ONLY use information from the provided context to answer
2. If the context doesn't contain enough information, say so clearly
3. Cite which source document(s) your answer comes from
4. Be concise and precise
5. If multiple sources agree, synthesize them into one clear answer
6. If sources disagree, mention both perspectives"""
    
    user_message = f"""Context from uploaded documents:

{context_string}

---

Question: {query}

Provide a clear answer based on the context above, citing which source documents support your answer."""

    response = co.chat(
        model="command-r7b-12-2024",
        messages=[
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_message}
        ]
    )
    
    answer = response.message.content[0].text
    
    return {
        "answer": answer,
        "sources": sources,
        "num_chunks_used": len(context_chunks),
        "context_chunks": [
            {"text": c["text"][:200] + "...", "source": c["source"]}
            for c in context_chunks
        ]
    }