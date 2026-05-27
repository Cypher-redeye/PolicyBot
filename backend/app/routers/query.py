from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from app.core.dependencies import get_current_user
from app.rag.pipeline import query_pipeline, get_rag

router = APIRouter(prefix="/query", tags=["query"])


class QueryRequest(BaseModel):
    question: str
    session_id: str | None = None


@router.post("/")
def query(request: QueryRequest, current_user: dict = Depends(get_current_user)):
    return query_pipeline(
        request.question, 
        user_id=current_user["id"], 
        session_id=request.session_id,
        language=current_user.get("preferred_language", "English")
    )


@router.get("/history")
def get_history(
    limit: int = Query(default=10, ge=1),
    session_id: str | None = None,
    current_user: dict = Depends(get_current_user),
):
    return get_rag().get_history(limit=limit, user_id=current_user["id"], session_id=session_id)

