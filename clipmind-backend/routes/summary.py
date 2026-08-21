from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json

from models.database import get_db
from models.db_models import Video, User
from models.schemas import VideoIdBody
from services import pipeline, activity_service
from routes.auth import get_current_user

router = APIRouter(tags=["summary"])


@router.post("/generate-summary")
def generate_summary(
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
            detail="Generate the transcript before generating a summary.",
        )

    try:
        video = pipeline.run_summary(db, video)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Summary generation failed: {e}",
        ) from e

    activity_service.log(
        db,
        current_user.id,
        activity_service.SUMMARY_GENERATED,
        video_id=video.id,
        details=video.title,
    )

    return {
        "videoId": video.id,
        "summary": json.loads(video.summary_json or "{}"),
    }


@router.get("/summary/{video_id}")
def get_summary(
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
        "summary": (
            json.loads(video.summary_json)
            if video.summary_json
            else None
        ),
    }