"""
Keyword router: endpoints for extracting keywords from transcripts.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.database import get_db
from app.models.video import Video
from app.schemas.keyword import (
    KeywordExtractRequest,
    KeywordExtractResponse,
    KeywordItem,
)
from app.services.keyword_service import KeywordService
from app.services.video_service import VideoService

logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/api/videos/{video_id}/keywords",
    tags=["Keywords"],
)

service = KeywordService()


def _get_video_or_404(
    db: Session,
    video_id: int,
    current_user,
) -> Video:
    """Fetch video and allow read access if published or owned by the user."""

    video = VideoService.get_video_by_id(db, video_id)

    if video is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )

    if not VideoService.is_accessible(video, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this video",
        )

    return video


# ---------------------------------------------------------
# Extract Keywords
# ---------------------------------------------------------


@router.post("/extract", response_model=KeywordExtractResponse)
def extract_keywords(
    video_id: int,
    payload: KeywordExtractRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Extract the most frequent meaningful keywords from a transcript.
    Keywords are exact words from the transcript (not AI-generated).
    """

    _get_video_or_404(db, video_id, current_user)

    transcript = payload.transcript

    if not transcript or not transcript.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transcript text is empty. Provide a valid transcript.",
        )

    try:
        keywords_data = service.extract_keywords(
            transcript=transcript,
            top_n=payload.top_n,
        )

        keywords = [KeywordItem(**k) for k in keywords_data]

        return KeywordExtractResponse(
            keywords=keywords,
            total=len(keywords),
        )

    except Exception as e:
        logger.exception("Keyword extraction failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Keyword extraction failed: {str(e)}",
        )