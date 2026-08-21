from sqlalchemy.orm import Session

from app.models.user import User
from app.models.role import Role
from app.models.video import Video


# ==========================================
# Admin Dashboard
# ==========================================
def get_admin_dashboard(db: Session):

    total_users = db.query(User).count()

    total_videos = db.query(Video).count()

    uploaded = db.query(Video).filter(
        Video.status == "Uploaded"
    ).count()

    processing = db.query(Video).filter(
        Video.status == "Processing"
    ).count()

    completed = db.query(Video).filter(
        Video.status == "Completed"
    ).count()

    admins = (
        db.query(User)
        .join(Role)
        .filter(Role.role_name == "admin")
        .count()
    )

    creators = (
        db.query(User)
        .join(Role)
        .filter(Role.role_name == "creator")
        .count()
    )

    educators = (
        db.query(User)
        .join(Role)
        .filter(Role.role_name == "educator")
        .count()
    )

    learners = (
        db.query(User)
        .join(Role)
        .filter(Role.role_name == "learner")
        .count()
    )

    return {
        "total_users": total_users,
        "total_videos": total_videos,
        "uploaded_videos": uploaded,
        "processing_jobs": processing,
        "completed_videos": completed,
        "admins": admins,
        "content_creators": creators,
        "educators": educators,
        "learners": learners,
        "storage_used": "0 GB"
    }


# ==========================================
# Creator Dashboard
# ==========================================
def get_creator_dashboard(db: Session):

    uploaded = db.query(Video).count()

    processing = db.query(Video).filter(
        Video.status == "Processing"
    ).count()

    completed = db.query(Video).filter(
        Video.status == "Completed"
    ).count()

    return {
        "uploaded_videos": uploaded,
        "processing_videos": processing,
        "processed_videos": completed,
        "ai_summaries": completed,
        "transcripts": completed
    }


# ==========================================
# Educator Dashboard
# ==========================================
def get_educator_dashboard(db: Session):

    total_videos = db.query(Video).count()

    completed = db.query(Video).filter(
        Video.status == "Completed"
    ).count()

    return {
        "total_courses": 0,
        "total_videos": total_videos,
        "total_students": 0,
        "ai_notes": completed
    }


# ==========================================
# Learner Dashboard
# ==========================================
def get_learner_dashboard(db: Session):

    completed = db.query(Video).filter(
        Video.status == "Completed"
    ).count()

    return {
        "videos_watched": completed,
        "bookmarks": 0,
        "completed_courses": 0,
        "ai_summaries": completed
    }