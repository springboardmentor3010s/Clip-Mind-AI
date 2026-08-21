import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from models.database import get_db
from models.db_models import Video, User
from models.schemas import VideoIdBody
from services import pipeline, analytics_service, activity_service
from routes.auth import get_current_user

router = APIRouter(tags=["analytics"])


@router.get("/analytics")
def get_analytics(
    videoId: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Per-video analytics.
    if videoId:
        video = (
            db.query(Video)
            .filter(
                Video.id == videoId,
                Video.user_id == current_user.id,
            )
            .first()
        )

        if not video:
            raise HTTPException(
                status_code=404,
                detail="Video not found.",
            )

        if video.analytics_json:
            return {
                "videoId": video.id,
                "analytics": json.loads(video.analytics_json),
            }

        if not video.transcript_json or video.transcript_json == "[]":
            raise HTTPException(
                status_code=400,
                detail="Generate the transcript before viewing analytics.",
            )

        video = pipeline.run_analytics(db, video)

        return {
            "videoId": video.id,
            "analytics": json.loads(video.analytics_json),
        }

    # Aggregate analytics.
    # Administrators can see all recordings.
    # Other users can only see their own recordings.
    query = db.query(Video)

    if current_user.role != "Administrator":
        query = query.filter(Video.user_id == current_user.id)

    videos = (
        query
        .order_by(Video.created_at.desc())
        .all()
    )

    records = [v.to_record() for v in videos]

    return {
        "videoId": None,
        "analytics": analytics_service.aggregate_analytics(records),
    }


@router.post("/generate-analytics")
def generate_analytics(
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
            detail="Generate the transcript before computing analytics.",
        )

    try:
        video = pipeline.run_analytics(db, video)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analytics generation failed: {e}",
        ) from e

    activity_service.log(
        db,
        current_user.id,
        activity_service.ANALYTICS_GENERATED,
        video_id=video.id,
        details=video.title,
    )

    return {
        "videoId": video.id,
        "analytics": json.loads(
            video.analytics_json
        ),
    }