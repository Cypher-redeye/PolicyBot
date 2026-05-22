import os
from fastapi import HTTPException, UploadFile, status
from app.core import supabase_db, supabase_storage

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md"}


def upload_document(file: UploadFile, user_id: str) -> dict:
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File type not supported")

    file_bytes = file.file.read()
    storage_path = f"{user_id}/{file.filename}"

    # Upload to Supabase Storage
    try:
        supabase_storage.upload_file(storage_path, file_bytes, file.content_type or "application/octet-stream")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {e}")

    # Record in DB via REST API
    doc = supabase_db.insert("documents", {
        "user_id": user_id,
        "filename": file.filename,
        "storage_path": storage_path,
        "status": "uploaded",
    })

    # Ingest into pgvector via RAG pipeline
    try:
        from app.rag.pipeline import ingest_document_bytes
        ingest_document_bytes(file_bytes, file.filename, doc["id"])
        supabase_db.update("documents", {"id": doc["id"]}, {"status": "indexed"})
        doc["status"] = "indexed"
    except Exception as e:
        print(f"Warning: RAG ingestion failed: {e}")
        supabase_db.update("documents", {"id": doc["id"]}, {"status": "failed"})
        doc["status"] = "failed"

    return doc


def list_documents(user_id: str) -> list:
    return supabase_db.select("documents", filters={"user_id": user_id})


def delete_document(doc_id: str, user_id: str) -> None:
    docs = supabase_db.select("documents", filters={"id": doc_id, "user_id": user_id})
    if not docs:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    doc = docs[0]

    # Remove from Supabase Storage
    try:
        supabase_storage.delete_file(doc["storage_path"])
    except Exception as e:
        print(f"Warning: Storage delete failed: {e}")

    supabase_db.delete("documents", {"id": doc_id})
