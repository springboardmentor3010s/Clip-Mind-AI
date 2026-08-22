from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.auth.authorization import require_roles
from app.core.enums import UserRole

from app.crud.video import get_video_by_id
from app.crud.transcript import (
    get_transcript_by_video,
    update_transcript
)

from app.schemas.transcript import (
    TranscriptResponse,
    TranscriptUpdate
)


router = APIRouter(
    prefix="/transcripts",
    tags=["Transcripts"]
)


# =========================================================
# GET TRANSCRIPT
# =========================================================

@router.get(
    "/{video_id}",
    response_model=TranscriptResponse
)
def read_transcript(
    video_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            UserRole.CONTENT_CREATOR,
            UserRole.EDUCATOR,
            UserRole.ADMIN
        )
    )
):

    # ---------------------------------------------------------
    # 1. Verify role and video ownership
    # ---------------------------------------------------------

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

    # ---------------------------------------------------------
    # 2. Get transcript
    # ---------------------------------------------------------

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


# =========================================================
# UPDATE TRANSCRIPT
# =========================================================

@router.put(
    "/{video_id}",
    response_model=TranscriptResponse
)
def edit_transcript(
    video_id: int,
    transcript_data: TranscriptUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            UserRole.CONTENT_CREATOR,
            UserRole.EDUCATOR,
            UserRole.ADMIN
        )
    )
):

    # ---------------------------------------------------------
    # 1. Verify video ownership
    # ---------------------------------------------------------

    video = get_video_by_id(
        db,
        video_id,
        current_user.id
    )

    if not video:
        raise HTTPException(
            status_code=404,
            detail="Video not found or you do not have permission to edit it."
        )

    # ---------------------------------------------------------
    # 2. Get transcript
    # ---------------------------------------------------------

    transcript = get_transcript_by_video(
        db,
        video
    )

    if not transcript:
        raise HTTPException(
            status_code=404,
            detail="Transcript not found."
        )

    # ---------------------------------------------------------
    # 3. Update transcript
    # ---------------------------------------------------------

    updated_transcript = update_transcript(
        db=db,
        transcript=transcript,
        transcript_text=transcript_data.transcript_text
    )

    return updated_transcript