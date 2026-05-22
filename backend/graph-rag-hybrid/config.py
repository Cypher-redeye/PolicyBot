import os
from typing import List, Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class RAGConfig:
    # Azure OpenAI
    AZURE_ENDPOINT = os.getenv("AZURE_ENDPOINT", "")
    AZURE_API_KEY = os.getenv("AZURE_API_KEY", "")
    AZURE_API_VERSION = os.getenv("AZURE_API_VERSION", "2023-05-15")
    MODEL_NAME = os.getenv("MODEL_NAME", "gpt-4o")
    DEPLOYMENT_NAME = os.getenv("DEPLOYMENT_NAME", "gpt-4o")
    EMBEDDING_DEPLOYMENT = os.getenv("EMBEDDING_DEPLOYMENT", "text-embedding-ada-002")

    # Supabase / pgvector (replaces ChromaDB)
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
    DATABASE_URL = os.getenv("DATABASE_URL", "")
    PGVECTOR_TABLE = os.getenv("PGVECTOR_TABLE", "document_chunks")
    COLLECTION_NAME = os.getenv("PGVECTOR_TABLE", "document_chunks")  # alias for compatibility

    # BM25 (kept for hybrid retrieval)
    BM25_INDEX_PATH = os.getenv("BM25_INDEX_PATH", "./bm25_index/bm25.pkl")
    BM25_ENABLED = os.getenv("BM25_ENABLED", "true").lower() == "true"

    # Graph (disabled — Neo4j removed)
    GRAPH_ENABLED = False

    # Chunking
    CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "1000"))
    CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "200"))

    # Retrieval tuning
    TOP_K = int(os.getenv("TOP_K", "4"))
    RETRIEVER_K = int(os.getenv("RETRIEVER_K", "10"))
    RRF_K = int(os.getenv("RRF_K", "60"))

    # LLM
    TEMPERATURE = float(os.getenv("TEMPERATURE", "0.3"))
    MAX_TOKENS = int(os.getenv("MAX_TOKENS", "1000"))
