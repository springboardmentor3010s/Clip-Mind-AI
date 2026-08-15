from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.auth.dependencies import get_current_user
from app.crud.video import get_video_by_id
from app.crud.transcript import get_transcript_by_video
from app.schemas.transcript import TranscriptResponse

router = APIRouter(
    prefix="/transcripts",
    tags=["Transcripts"]
)


@router.get(
    "/{video_id}",
    response_model=TranscriptResponse
)
def read_transcript(
    video_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    video = get_video_by_id(
        db,
        video_id,
        current_user.id
    )

    if not video:
        raise HTTPException(
            status_code=404,
            detail="Video not found."
        )

    transcript = get_transcript_by_video(
        db,
        video
    )

    if not transcript:
        raise HTTPException(
            status_code=404,
            detail="Transcript not found."
        )

    return transcript