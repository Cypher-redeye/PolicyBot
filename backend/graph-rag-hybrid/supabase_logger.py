"""
Query logger using Supabase PostgREST REST API via httpx.
Writes to the query_logs table — no direct Postgres connection needed.
"""
from typing import List, Dict, Optional
import os
import httpx


class SupabaseLogger:
    def __init__(self, config):
        self._url = getattr(config, "SUPABASE_URL", "") or os.getenv("SUPABASE_URL", "")
        self._key = getattr(config, "SUPABASE_SERVICE_KEY", "") or os.getenv("SUPABASE_SERVICE_KEY", "")
        self._available = bool(self._url and self._key)
        if self._available:
            print("[OK] SupabaseLogger initialized (REST API)")
        else:
            print("Warning: SUPABASE_URL/KEY not set. Query logging disabled.")

    def _headers(self) -> dict:
        return {
            "apikey": self._key,
            "Authorization": f"Bearer {self._key}",
            "Content-Type": "application/json",
        }

    def _rest(self, path: str) -> str:
        return f"{self._url}/rest/v1/{path}"

    def log_query(self, query_text, answer, context_texts, execution_time, num_sources, session_id=None, user_id=None):
        if not self._available:
            return
        try:
            payload = {
                "query_text": query_text, 
                "answer": answer, 
                "session_id": session_id,
                "num_sources": num_sources, 
                "execution_time": execution_time
            }
            if user_id:
                payload["user_id"] = user_id
            httpx.post(
                self._rest("query_logs"),
                json=payload,
                headers=self._headers(), timeout=10,
            )
        except Exception as e:
            print(f"Warning: Failed to log query ({e})")

    def log_document(self, name, doc_type, chunks_count, file_size, file_path):
        pass  # Tracked by the API layer

    def get_recent_queries(self, limit: int = 10, user_id: Optional[str] = None, session_id: Optional[str] = None) -> List[Dict]:
        if not self._available:
            return []
        try:
            params = {"select": "*", "order": "created_at.desc", "limit": str(limit)}
            if session_id:
                params["session_id"] = f"eq.{session_id}"
            if user_id:
                params["user_id"] = f"eq.{user_id}"
            r = httpx.get(self._rest("query_logs"), params=params, headers=self._headers(), timeout=10)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            print(f"Warning: Failed to fetch query logs ({e})")
            return []

    def get_conversation_history(self, session_id: str, limit: int = 20, user_id: Optional[str] = None) -> List[Dict]:
        return self.get_recent_queries(limit=limit, user_id=user_id, session_id=session_id)

    def get_all_documents(self) -> List[Dict]:
        return []

    def close(self):
        pass
