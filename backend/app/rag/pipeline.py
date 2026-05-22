import sys
import os
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../graph-rag-hybrid"))

from rag_system import DocumentRAGSystem
from config import RAGConfig

_rag: DocumentRAGSystem | None = None


def get_rag() -> DocumentRAGSystem:
    global _rag
    if _rag is None:
        _rag = DocumentRAGSystem(RAGConfig())
    return _rag


def ingest_document_bytes(file_bytes: bytes, filename: str, document_id: str) -> None:
    """Ingest a document from bytes (used when file is in Supabase Storage)."""
    ext = os.path.splitext(filename)[1].lower()
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name
    try:
        get_rag().add_file(tmp_path, metadata={"name": filename, "document_id": document_id})
    finally:
        os.unlink(tmp_path)


def ingest_document(filepath: str) -> None:
    """Ingest a document from a local filepath (kept for compatibility)."""
    get_rag().add_file(filepath)


def query_pipeline(question: str, session_id: str | None = None) -> dict:
    return get_rag().query(question, session_id)
