"""
pgvector store using Supabase PostgREST REST API.
Replaces direct psycopg2 connection — works over HTTPS, no IPv6 DNS issues.
"""
import json
import os
import httpx
from typing import List, Optional, Any

from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever
from langchain_core.callbacks import CallbackManagerForRetrieverRun


def _headers() -> dict:
    key = os.getenv("SUPABASE_SERVICE_KEY", "")
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def _base_url() -> str:
    return f"{os.getenv('SUPABASE_URL', '')}/rest/v1"


class PGVectorStore:
    """
    pgvector store via Supabase PostgREST.
    Inserts chunks via REST API, searches via RPC function.
    """

    def __init__(self, supabase_url: str, service_key: str, embeddings, table_name: str = "document_chunks"):
        self.supabase_url = supabase_url
        self.service_key = service_key
        self.embeddings = embeddings
        self.table_name = table_name

    def _headers(self) -> dict:
        return {
            "apikey": self.service_key,
            "Authorization": f"Bearer {self.service_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    def _rest_url(self, path: str) -> str:
        return f"{self.supabase_url}/rest/v1/{path}"

    def add_documents(self, documents: List[Document]) -> None:
        if not documents:
            return

        texts = [doc.page_content for doc in documents]
        metadatas = [doc.metadata for doc in documents]

        print(f"  Generating embeddings for {len(texts)} chunks...")
        embedding_vectors = self.embeddings.embed_documents(texts)

        rows = []
        for text, meta, emb in zip(texts, metadatas, embedding_vectors):
            rows.append({
                "content": text,
                "metadata": meta,
                "embedding": emb,  # PostgREST accepts list → casts to vector
            })

        # Insert in batches of 50
        batch_size = 50
        for i in range(0, len(rows), batch_size):
            batch = rows[i:i + batch_size]
            r = httpx.post(
                self._rest_url(self.table_name),
                json=batch,
                headers=self._headers(),
                timeout=60,
            )
            r.raise_for_status()
        print(f"  Stored {len(documents)} chunks in pgvector (via REST)")

    def similarity_search(self, query: str, k: int = 4) -> List[Document]:
        query_embedding = self.embeddings.embed_query(query)
        r = httpx.post(
            self._rest_url("rpc/match_document_chunks"),
            json={"query_embedding": query_embedding, "match_count": k},
            headers=self._headers(),
            timeout=30,
        )
        r.raise_for_status()
        rows = r.json()
        docs = []
        for row in rows:
            meta = row.get("metadata", {})
            if isinstance(meta, str):
                meta = json.loads(meta)
            meta["_similarity"] = row.get("similarity", 0)
            docs.append(Document(page_content=row["content"], metadata=meta))
        return docs

    def as_retriever(self, search_kwargs: Optional[dict] = None) -> "PGVectorRetriever":
        k = (search_kwargs or {}).get("k", 4)
        return PGVectorRetriever(store=self, k=k)


class PGVectorRetriever(BaseRetriever):
    store: Any
    k: int = 4

    class Config:
        arbitrary_types_allowed = True

    def _get_relevant_documents(
        self, query: str, *, run_manager: CallbackManagerForRetrieverRun
    ) -> List[Document]:
        return self.store.similarity_search(query, k=self.k)
