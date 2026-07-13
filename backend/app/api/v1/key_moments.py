"""
Key Moments Detection Module endpoints.
"""
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.key_moments import KeyMomentsOut
from app.services.key_moments_service import generate_key_moments, get_key_moments

router = APIRouter(prefix="/videos", tags=["Key Moments"])


@router.post("/{video_id}/key-moments", response_model=KeyMomentsOut)
async def create_key_moments(
    video_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Detect keywords, highlight segments, and topic boundaries from the video's transcript."""
    return await generate_key_moments(db, video_id, current_user)


@router.get("/{video_id}/key-moments", response_model=KeyMomentsOut)
async def read_key_moments(
    video_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch previously generated key moments."""
    return await get_key_moments(db, video_id, current_user)