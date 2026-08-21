from sqlalchemy.orm import Session
from fastapi import HTTPException

from models.video import Video
from models.user import User

# Use your existing services
from services.transcription_service import generate_transcript
from services.summary_service import (
    generate_short_summary,
    generate_detailed_summary,
)


# ======================================================
# My Videos
# ======================================================

def get_my_videos(db: Session, educator_id: int):
    videos = (
        db.query(Video)
        .filter(Video.user_id == educator_id)
        .order_by(Video.id.desc())
        .all()
    )

    return videos


# ======================================================
# Get Single Video
# ======================================================

def get_video(db: Session, video_id: int, educator_id: int):

    video = (
        db.query(Video)
        .filter(
            Video.id == video_id,
            Video.user_id == educator_id
        )
        .first()
    )

    if not video:
        raise HTTPException(
            status_code=404,
            detail="Video not found."
        )

    return video


# ======================================================
# Edit Transcript
# ======================================================

def update_transcript(
    db: Session,
    video_id: int,
    educator_id: int,
    transcript: str
):

    video = get_video(db, video_id, educator_id)

    video.transcript = transcript

    db.commit()
    db.refresh(video)

    return {
        "message": "Transcript updated successfully.",
        "video": video
    }


# ======================================================
# Auto Generate Transcript Again
# ======================================================

def regenerate_transcript(
    db: Session,
    video_id: int,
    educator_id: int
):

    video = get_video(db, video_id, educator_id)

    transcript = generate_transcript(video.video_path)

    video.transcript = transcript

    db.commit()
    db.refresh(video)

    return {
        "message": "Transcript regenerated successfully.",
        "transcript": transcript
    }


# ======================================================
# Short Summary
# ======================================================

def create_short_summary(
    db: Session,
    video_id: int,
    educator_id: int
):

    video = get_video(db, video_id, educator_id)

    if not video.transcript:
        raise HTTPException(
            status_code=400,
            detail="Transcript not found."
        )

    summary = generate_short_summary(video.transcript)

    video.short_summary = summary

    db.commit()

    return {
        "message": "Short summary generated.",
        "summary": summary
    }


# ======================================================
# Detailed Summary
# ======================================================

def create_detailed_summary(
    db: Session,
    video_id: int,
    educator_id: int
):

    video = get_video(db, video_id, educator_id)

    if not video.transcript:
        raise HTTPException(
            status_code=400,
            detail="Transcript not found."
        )

    summary = generate_detailed_summary(video.transcript)

    video.detailed_summary = summary

    db.commit()

    return {
        "message": "Detailed summary generated.",
        "summary": summary
    }


# ======================================================
# Share with Learners
# ======================================================

def share_video(
    db: Session,
    video_id: int,
    educator_id: int,
    learner_ids: list
):

    video = get_video(db, video_id, educator_id)

    # Sharing logic will be added later
    # (Share table or Classroom table)

    return {
        "message": "Video shared successfully.",
        "video_id": video.id,
        "shared_to": learner_ids
    }


# ======================================================
# Engagement Analysis
# ======================================================

def get_engagement_analysis(
    db: Session,
    educator_id: int
):

    videos = (
        db.query(Video)
        .filter(Video.user_id == educator_id)
        .all()
    )

    total_videos = len(videos)

    total_views = sum(
        getattr(v, "views", 0)
        for v in videos
    )

    total_likes = sum(
        getattr(v, "likes", 0)
        for v in videos
    )

    total_bookmarks = sum(
        getattr(v, "bookmarks", 0)
        for v in videos
    )

    return {
        "total_videos": total_videos,
        "total_views": total_views,
        "total_likes": total_likes,
        "total_bookmarks": total_bookmarks
    }


# ======================================================
# Classroom Analytics
# ======================================================

def get_classroom_analytics(
    db: Session,
    educator_id: int
):

    total_students = (
        db.query(User)
        .filter(User.role == "learner")
        .count()
    )

    total_videos = (
        db.query(Video)
        .filter(Video.user_id == educator_id)
        .count()
    )

    return {
        "total_students": total_students,
        "total_videos": total_videos,
        "active_students": 0,
        "completed_students": 0,
        "average_progress": 0
    }