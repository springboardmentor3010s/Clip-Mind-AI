from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json

from models.database import get_db
from models.db_models import Video, User
from models.schemas import VideoIdBody
from services import pipeline, activity_service
from routes.auth import get_current_user

router = APIRouter(tags=["moments"])


@router.post("/generate-key-moments")
def generate_key_moments(
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

    if not video.transcript_json or video.transcript_json == "[]":
        raise HTTPException(
            status_code=400,
            detail="Generate the transcript before extracting key moments.",
        )

    try:
        video = pipeline.run_moments(db, video)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Key moment extraction failed: {e}",
        ) from e

    activity_service.log(
        db,
        current_user.id,
        activity_service.MOMENTS_GENERATED,
        video_id=video.id,
        details=video.title,
    )

    return {
        "videoId": video.id,
        "moments": json.loads(
            video.moments_json or "[]"
        ),
    }


@router.get("/key-moments/{video_id}")
def get_key_moments(
    video_id: str,
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

    return {
        "videoId": video.id,
        "moments": json.loads(
            video.moments_json or "[]"
        ),
    }