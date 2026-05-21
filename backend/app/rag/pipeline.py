import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../../graph-rag-hybrid"))

from rag_system import DocumentRAGSystem
from config import RAGConfig

_rag: DocumentRAGSystem | None = None


def get_rag() -> DocumentRAGSystem:
    global _rag
    if _rag is None:
        _rag = DocumentRAGSystem(RAGConfig())
    return _rag


def ingest_document(filepath: str) -> None:
    get_rag().add_file(filepath)


def query_pipeline(question: str, session_id: str | None = None) -> dict:
    return get_rag().query(question, session_id)
