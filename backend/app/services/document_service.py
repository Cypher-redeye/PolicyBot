import os
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from app.models.document import Document

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md"}


def upload_document(db: Session, file: UploadFile, user_id: int) -> Document:
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File type not supported")

    filepath = os.path.join(UPLOAD_DIR, file.filename)
    with open(filepath, "wb") as f:
        f.write(file.file.read())

    doc = Document(filename=file.filename, filepath=filepath, status="uploaded", user_id=user_id)
    db.add(doc)
    db.commit()
    db.refresh(doc)

    try:
        from app.rag.pipeline import ingest_document
        ingest_document(filepath)
        doc.status = "indexed"
    except Exception:
        doc.status = "failed"

    db.commit()
    db.refresh(doc)
    return doc


def list_documents(db: Session, user_id: int) -> list[Document]:
    return db.query(Document).filter(Document.user_id == user_id).all()


def delete_document(db: Session, doc_id: int, user_id: int) -> None:
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == user_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if os.path.exists(doc.filepath):
        os.remove(doc.filepath)
    db.delete(doc)
    db.commit()
