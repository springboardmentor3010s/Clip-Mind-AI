"""
Quiz router: endpoints for generating quizzes from transcripts/summaries.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.database import get_db
from app.models.video import Video
from app.schemas.quiz import QuizGenerateRequest, QuizGenerateResponse, QuizQuestion
from app.services.quiz_service import QuizService
from app.services.video_service import VideoService

logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/api/videos/{video_id}/quiz",
    tags=["Quiz"],
)

service = QuizService()


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
# Generate Quiz
# ---------------------------------------------------------


@router.post("/generate", response_model=QuizGenerateResponse)
def generate_quiz(
    video_id: int,
    payload: QuizGenerateRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate a multiple-choice quiz from a video's transcript or summary.
    The transcript field in the request body should contain the text to generate from.
    """

    video = _get_video_or_404(db, video_id, current_user)

    transcript = payload.transcript

    if not transcript or not transcript.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transcript text is empty. Provide a valid transcript or summary.",
        )

    try:
        questions_data = service.generate_quiz(
            transcript=transcript,
            num_questions=payload.count,
            difficulty=payload.difficulty,
        )

        questions = [QuizQuestion(**q) for q in questions_data]

        return QuizGenerateResponse(
            questions=questions,
            total=len(questions),
        )

    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )