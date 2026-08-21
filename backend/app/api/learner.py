from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.services.learner_service import (
    get_available_videos,
    get_video_by_id,
    get_video_transcript,
    get_video_summary,
    get_video_key_moments,
    search_videos
)

router = APIRouter(
    prefix="/learner",
    tags=["Learner"]
)


# ==========================================
# Available Videos
# ==========================================

@router.get("/videos")
def available_videos(
    db: Session = Depends(get_db)
):

    return get_available_videos(db)


# ==========================================
# Watch Video
# ==========================================

@router.get("/videos/{video_id}")
def watch_video(
    video_id: int,
    db: Session = Depends(get_db)
):

    video = get_video_by_id(db, video_id)

    if not video:
        raise HTTPException(
            status_code=404,
            detail="Video not found"
        )

    return video


# ==========================================
# Transcript
# ==========================================

@router.get("/videos/{video_id}/transcript")
def transcript(
    video_id: int,
    db: Session = Depends(get_db)
):

    data = get_video_transcript(db, video_id)

    if not data:
        raise HTTPException(
            status_code=404,
            detail="Video not found"
        )

    return data


# ==========================================
# Summary
# ==========================================

@router.get("/videos/{video_id}/summary")
def summary(
    video_id: int,
    db: Session = Depends(get_db)
):

    data = get_video_summary(db, video_id)

    if not data:
        raise HTTPException(
            status_code=404,
            detail="Video not found"
        )

    return data


# ==========================================
# Key Moments
# ==========================================

@router.get("/videos/{video_id}/key-moments")
def key_moments(
    video_id: int,
    db: Session = Depends(get_db)
):

    data = get_video_key_moments(db, video_id)

    if not data:
        raise HTTPException(
            status_code=404,
            detail="Video not found"
        )

    return data


# ==========================================
# Search
# ==========================================

@router.get("/search")
def search(
    keyword: str,
    db: Session = Depends(get_db)
):

    return search_videos(db, keyword)
