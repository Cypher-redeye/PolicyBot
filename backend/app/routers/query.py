from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.core.dependencies import get_current_user
from app.models.user import User
from app.rag.pipeline import query_pipeline

router = APIRouter(prefix="/query", tags=["query"])


class QueryRequest(BaseModel):
    question: str
    session_id: str | None = None


@router.post("/")
def query(request: QueryRequest, current_user: User = Depends(get_current_user)):
    return query_pipeline(request.question, request.session_id)
