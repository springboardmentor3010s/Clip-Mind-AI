import json

from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.video import Video


# ==========================================
# Browse Available Videos
# ==========================================

def get_available_videos(db: Session):

    videos = (
        db.query(Video)
        .filter(Video.status == "Processed")
        .order_by(Video.created_at.desc())
        .all()
    )

    return [
        {
            "id": video.id,
            "title": video.title,
            "thumbnail": video.thumbnail_path,
            "duration": video.duration,
            "status": video.status,
            "created_at": video.created_at
        }
        for video in videos
    ]


# ==========================================
# Watch Video
# ==========================================

def get_video_by_id(db: Session, video_id: int):

    video = (
        db.query(Video)
        .filter(Video.id == video_id)
        .first()
    )

    if not video:
        return None

    key_moments = video.key_moments

    if isinstance(key_moments, str):
        try:
            key_moments = json.loads(key_moments)
            if isinstance(key_moments, str):
                key_moments = json.loads(key_moments)
        except Exception:
            key_moments = []

    return {
        "id": video.id,
        "title": video.title,
        "video_path": video.file_path,
        "thumbnail": video.thumbnail_path,
        "duration": video.duration,
        "summary": video.summary or "",
        "transcript": video.transcript or "",
        "keywords": video.keywords or [],
        "key_moments": key_moments,
        "status": video.status,
        "created_at": video.created_at
    }


# ==========================================
# Transcript
# ==========================================

def get_video_transcript(db: Session, video_id: int):

    video = (
        db.query(Video)
        .filter(Video.id == video_id)
        .first()
    )

    if not video:
        return None

    return {
        "video_id": video.id,
        "transcript": video.transcript or ""
    }


# ==========================================
# Summary
# ==========================================

def get_video_summary(db: Session, video_id: int):

    video = (
        db.query(Video)
        .filter(Video.id == video_id)
        .first()
    )

    if not video:
        return None

    return {
        "video_id": video.id,
        "summary": video.summary or ""
    }


# ==========================================
# Key Moments
# ==========================================

def get_video_key_moments(db: Session, video_id: int):

    video = (
        db.query(Video)
        .filter(Video.id == video_id)
        .first()
    )

    if not video:
        return None

    key_moments = video.key_moments

    if key_moments is None:
        key_moments = []

    elif isinstance(key_moments, str):
        try:
            key_moments = json.loads(key_moments)

            # Handle double encoded JSON
            if isinstance(key_moments, str):
                key_moments = json.loads(key_moments)

        except Exception:
            key_moments = []

    return {
        "video_id": video.id,
        "key_moments": key_moments
    }


# ==========================================
# Search Videos
# ==========================================

def search_videos(db: Session, keyword: str):

    videos = (
        db.query(Video)
        .filter(Video.status == "Processed")
        .filter(
            or_(
                Video.title.ilike(f"%{keyword}%"),
                Video.transcript.ilike(f"%{keyword}%"),
                Video.summary.ilike(f"%{keyword}%")
            )
        )
        .all()
    )

    return [
        {
            "id": video.id,
            "title": video.title,
            "thumbnail": video.thumbnail_path,
            "duration": video.duration,
            "status": video.status
        }
        for video in videos
    ]