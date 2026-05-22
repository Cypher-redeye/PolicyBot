"""
Supabase database client using PostgREST REST API via httpx.
Replaces direct psycopg2 connection — works over HTTPS port 443.
Avoids IPv6-only DNS resolution issues with db.xxx.supabase.co.
"""
import httpx
from typing import Any, Dict, List, Optional
from app.core.config import settings


def _base_url() -> str:
    return f"{settings.SUPABASE_URL}/rest/v1"


def _headers(use_service_key: bool = True) -> dict:
    key = settings.SUPABASE_SERVICE_KEY if use_service_key else settings.SUPABASE_ANON_KEY
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


# ── Generic CRUD ─────────────────────────────────────────────────────────────

def select(table: str, filters: Optional[Dict] = None, columns: str = "*", limit: Optional[int] = None) -> List[Dict]:
    params = {"select": columns}
    if filters:
        params.update({k: f"eq.{v}" for k, v in filters.items()})
    if limit:
        params["limit"] = str(limit)
    r = httpx.get(f"{_base_url()}/{table}", params=params, headers=_headers(), timeout=15)
    r.raise_for_status()
    return r.json()


def insert(table: str, data: Dict) -> Dict:
    r = httpx.post(f"{_base_url()}/{table}", json=data, headers=_headers(), timeout=15)
    r.raise_for_status()
    result = r.json()
    return result[0] if isinstance(result, list) else result


def update(table: str, filters: Dict, data: Dict) -> List[Dict]:
    params = {k: f"eq.{v}" for k, v in filters.items()}
    r = httpx.patch(f"{_base_url()}/{table}", json=data, params=params, headers=_headers(), timeout=15)
    r.raise_for_status()
    return r.json()


def delete(table: str, filters: Dict) -> None:
    params = {k: f"eq.{v}" for k, v in filters.items()}
    r = httpx.delete(f"{_base_url()}/{table}", params=params, headers=_headers(), timeout=15)
    r.raise_for_status()


def rpc(function_name: str, params: Dict) -> Any:
    """Call a Postgres function via PostgREST RPC."""
    r = httpx.post(f"{_base_url()}/rpc/{function_name}", json=params, headers=_headers(), timeout=30)
    r.raise_for_status()
    return r.json()
