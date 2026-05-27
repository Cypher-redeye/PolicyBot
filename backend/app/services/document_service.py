import os
from fastapi import HTTPException, UploadFile, status, BackgroundTasks
from app.core import supabase_db, supabase_storage

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md"}


def upload_document(file: UploadFile, user_id: str, background_tasks: BackgroundTasks) -> dict:
    safe_filename = os.path.basename(file.filename)
    ext = os.path.splitext(safe_filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File type not supported")

    file_bytes = file.file.read()
    storage_path = f"{user_id}/{safe_filename}"

    # Upload to Supabase Storage
    try:
        supabase_storage.upload_file(storage_path, file_bytes, file.content_type or "application/octet-stream")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {e}")

    # Record in DB via REST API
    doc = supabase_db.insert("documents", {
        "user_id": user_id,
        "filename": safe_filename,
        "storage_path": storage_path,
        "status": "uploaded",
    })

    # Ingest in a background task so upload returns immediately
    def run_bg_ingestion():
        try:
            from app.rag.pipeline import ingest_document_bytes
            ingest_document_bytes(file_bytes, safe_filename, doc["id"], user_id)
            supabase_db.update("documents", {"id": doc["id"]}, {"status": "indexed"})
            print(f"[OK] Background RAG ingestion successful for document {doc['id']}")
        except Exception as e:
            print(f"Warning: Background RAG ingestion failed for document {doc['id']}: {e}")
            supabase_db.update("documents", {"id": doc["id"]}, {"status": "failed"})

    background_tasks.add_task(run_bg_ingestion)

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

    supabase_db.delete("documents", {"id": doc_id, "user_id": user_id})
