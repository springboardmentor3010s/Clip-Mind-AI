"""
Video Summarization Module endpoints.
"""
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.summary import SummaryOut
from app.services.summary_service import generate_summary, get_summary

router = APIRouter(prefix="/videos", tags=["Summaries"])


@router.post("/{video_id}/summary", response_model=SummaryOut)
async def create_summary(
    video_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return await generate_summary(db, video_id, current_user)


@router.get("/{video_id}/summary", response_model=SummaryOut)
async def read_summary(
    video_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return await get_summary(db, video_id, current_user)