from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.services.chat_service import chat_with_video


router = APIRouter(
    prefix="/chat",
    tags=["AI Chat"]
)


# ==========================================
# Database Dependency
# ==========================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==========================================
# Request Model
# ==========================================

class ChatRequest(BaseModel):
    question: str


# ==========================================
# Chat with Video
# ==========================================

@router.post("/{video_id}")
def chat(
    video_id: int,
    request: ChatRequest,
    db: Session = Depends(get_db)
):

    result = chat_with_video(
        db,
        video_id,
        request.question
    )

    if not result["success"]:
        raise HTTPException(
            status_code=404,
            detail=result["message"]
        )

    return {
        "video_id": result["video_id"],
        "title": result["title"],
        "question": result["question"],
        "answer": result["answer"]
    }