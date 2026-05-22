"""
Supabase Storage client using plain httpx — no supabase-py SDK needed.
Avoids the supabase -> storage3 -> pyiceberg dependency that breaks Python 3.14.
"""
import httpx
from app.core.config import settings


def _headers() -> dict:
    return {
        "apikey": settings.SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}",
    }


def upload_file(storage_path: str, file_bytes: bytes, content_type: str = "application/octet-stream") -> None:
    """Upload a file to Supabase Storage."""
    url = f"{settings.SUPABASE_URL}/storage/v1/object/{settings.SUPABASE_STORAGE_BUCKET}/{storage_path}"
    headers = {**_headers(), "Content-Type": content_type, "x-upsert": "true"}
    response = httpx.put(url, content=file_bytes, headers=headers, timeout=60)
    response.raise_for_status()


def delete_file(storage_path: str) -> None:
    """Delete a file from Supabase Storage."""
    url = f"{settings.SUPABASE_URL}/storage/v1/object/{settings.SUPABASE_STORAGE_BUCKET}/{storage_path}"
    response = httpx.delete(url, headers=_headers(), timeout=30)
    # 404 is fine — file may already be gone
    if response.status_code not in (200, 204, 404):
        response.raise_for_status()


def get_public_url(storage_path: str) -> str:
    """Get a signed URL for a file (valid 1 hour)."""
    url = f"{settings.SUPABASE_URL}/storage/v1/object/sign/{settings.SUPABASE_STORAGE_BUCKET}/{storage_path}"
    response = httpx.post(url, json={"expiresIn": 3600}, headers=_headers(), timeout=10)
    response.raise_for_status()
    return response.json().get("signedURL", "")
