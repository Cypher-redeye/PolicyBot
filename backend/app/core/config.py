from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
import os


class Settings(BaseSettings):
    PROJECT_NAME: str = "PolicyBot API"
    API_V1_STR: str = "/api/v1"

    # PostgreSQL
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/policybot"

    # JWT
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Azure OpenAI
    AZURE_ENDPOINT: str = ""
    AZURE_API_KEY: str = ""
    AZURE_API_VERSION: str = "2023-05-15"
    MODEL_NAME: str = "gpt-4o"
    DEPLOYMENT_NAME: str = "gpt-4o"
    EMBEDDING_DEPLOYMENT: str = "text-embedding-ada-002"

    # ChromaDB
    CHROMA_PERSIST_DIR: str = "./chroma_db"
    COLLECTION_NAME: str = "document_qa"

    # Neo4j
    NEO4J_URI: str = ""
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = ""
    NEO4J_DATABASE: str = "neo4j"
    GRAPH_ENABLED: bool = True

    # BM25
    BM25_INDEX_PATH: str = "./bm25_index/bm25.pkl"
    BM25_ENABLED: bool = True

    # RAG tuning
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    TOP_K: int = 4
    RETRIEVER_K: int = 10
    RRF_K: int = 60
    GRAPH_HOPS: int = 1
    TEMPERATURE: float = 0.3
    MAX_TOKENS: int = 1000

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
