from fastapi import APIRouter, Depends, UploadFile, File
from app.core.dependencies import get_current_user
from app.schemas.document import DocumentResponse
from app.services.document_service import upload_document, list_documents, delete_document

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/", response_model=DocumentResponse, status_code=201)
def upload(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    return upload_document(file, current_user["id"])


@router.get("/", response_model=list[DocumentResponse])
def list_docs(current_user: dict = Depends(get_current_user)):
    return list_documents(current_user["id"])


@router.delete("/{doc_id}", status_code=204)
def delete(doc_id: str, current_user: dict = Depends(get_current_user)):
    delete_document(doc_id, current_user["id"])
