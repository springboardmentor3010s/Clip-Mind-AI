from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
import json

from models.database import get_db
from models.db_models import Video, User
from models.schemas import VideoIdBody
from services import pipeline, activity_service
from routes.auth import get_current_user

router = APIRouter(tags=["transcript"])


@router.post("/generate-transcript")
def generate_transcript(
    body: VideoIdBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    video = (
        db.query(Video)
        .filter(
            Video.id == body.videoId,
            Video.user_id == current_user.id,
        )
        .first()
    )

    if not video:
        raise HTTPException(
            status_code=404,
            detail="Video not found.",
        )

    try:
        video = pipeline.run_transcription(db, video)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Transcription failed: {e}",
        ) from e

    activity_service.log(
        db,
        current_user.id,
        activity_service.TRANSCRIPT_GENERATED,
        video_id=video.id,
        details=video.title,
    )

    return {
        "videoId": video.id,
        "transcript": json.loads(
            video.transcript_json or "[]"
        ),
        "language": video.language,
    }


@router.put("/transcript/{video_id}")
def update_transcript(
    video_id: str,
    body: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    video = (
        db.query(Video)
        .filter(
            Video.id == video_id,
            Video.user_id == current_user.id,
        )
        .first()
    )

    if not video:
        raise HTTPException(
            status_code=404,
            detail="Video not found.",
        )

    transcript = body.get("transcript")

    if not isinstance(transcript, list):
        raise HTTPException(
            status_code=400,
            detail="Transcript must be a list of segments.",
        )

    video.transcript_json = json.dumps(
        transcript,
        ensure_ascii=False,
    )

    db.commit()
    db.refresh(video)

    activity_service.log(
        db,
        current_user.id,
        activity_service.TRANSCRIPT_UPDATED,
        video_id=video.id,
        details=video.title,
    )

    return {
        "videoId": video.id,
        "transcript": json.loads(
            video.transcript_json or "[]"
        ),
        "language": video.language,
    }