from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.document import DocumentResponse
from app.services.document_service import upload_document, list_documents, delete_document

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/", response_model=DocumentResponse, status_code=201)
def upload(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return upload_document(db, file, current_user.id)


@router.get("/", response_model=list[DocumentResponse])
def list_docs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return list_documents(db, current_user.id)


@router.delete("/{doc_id}", status_code=204)
def delete(doc_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    delete_document(db, doc_id, current_user.id)
