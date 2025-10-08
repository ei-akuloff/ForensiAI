import chromadb
from chromadb.utils import embedding_functions
import os
from dotenv import load_dotenv
from typing import List, Dict, Any

load_dotenv()

from sentence_transformers import SentenceTransformer
from uuid import uuid4

# Load multilingual embedding model (supports English, Hindi, Hinglish)
# This model is compact and robust for cross-lingual semantic similarity
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

def get_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Generate embeddings using local sentence-transformers model.
    """
    if not texts:
        return []
    
    embeddings = model.encode(texts)
    return embeddings.tolist()

# Custom embedding function for ChromaDB
class LocalEmbeddingFunction(embedding_functions.EmbeddingFunction):
    def __init__(self, model):
        self.model = model

    def __call__(self, texts: List[str]) -> List[List[float]]:
        return get_embeddings(texts)

local_ef = LocalEmbeddingFunction(model)

# Initialize ChromaDB client (persistent)
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(
    name="ufdr_docs",
    embedding_function=local_ef
)

def add_documents(texts: List[str], session_id: str, metadatas: List[Dict[str, Any]] = None) -> None:
    """
    Add documents to the vector store.
    """
    if not texts:
        return

    if metadatas is None:
        metadatas = [{"source": "ufdr_file", "session_id": session_id} for _ in texts]
    else:
        # ensure each metadata has session association
        for md in metadatas:
            md["session_id"] = session_id
    
    # Use unique IDs to avoid collisions across multiple uploads
    ids = [f"doc_{uuid4()}" for _ in texts]
    
    collection.add(
        documents=texts,
        metadatas=metadatas,
        ids=ids
    )

def similarity_search(query: str, session_id: str, n_results: int = 5) -> tuple[List[str], List[Dict[str, Any]]]:
    """
    Perform similarity search for the query and return documents and metadatas.
    """
    results = collection.query(
        query_texts=[query],
        n_results=n_results,
        where={"session_id": session_id}
    )
    return results['documents'][0], results['metadatas'][0]

def get_full_context(query: str, session_id: str, n_results: int = 5) -> str:
    """
    Retrieve relevant documents and join them into a single context string.
    """
    docs, _ = similarity_search(query, session_id, n_results)
    return "\n\n".join(docs)

def delete_session(session_id: str) -> None:
    """
    Delete all documents associated with a session.
    """
    try:
        collection.delete(where={"session_id": session_id})
    except Exception:
        # If nothing to delete, ignore
        pass