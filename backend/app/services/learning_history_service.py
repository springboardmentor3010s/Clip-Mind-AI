from sqlalchemy.orm import Session

from app.models.learning_history import LearningHistory
from app.models.video import Video


# ==========================================
# Add / Update Learning History
# ==========================================

def add_learning_history(
    db: Session,
    user_id: int,
    video_id: int,
    progress: int = 0
):

    history = db.query(LearningHistory).filter(
        LearningHistory.user_id == user_id,
        LearningHistory.video_id == video_id
    ).first()

    if history:

        history.progress = progress

        db.commit()
        db.refresh(history)

        return {
            "success": True,
            "message": "Learning history updated",
            "history": history.to_dict()
        }

    history = LearningHistory(
        user_id=user_id,
        video_id=video_id,
        progress=progress
    )

    db.add(history)
    db.commit()
    db.refresh(history)

    return {
        "success": True,
        "message": "Learning history created",
        "history": history.to_dict()
    }


# ==========================================
# Get Learning History
# ==========================================

def get_learning_history(
    db: Session,
    user_id: int
):

    histories = db.query(LearningHistory).filter(
        LearningHistory.user_id == user_id
    ).order_by(
        LearningHistory.watched_at.desc()
    ).all()

    result = []

    for history in histories:

        video = db.query(Video).filter(
            Video.id == history.video_id
        ).first()

        if video:

            result.append({

                "history_id": history.id,

                "video_id": video.id,

                "title": video.title,

                "thumbnail": video.thumbnail_path,

                "duration": video.duration,

                "status": video.status,

                "progress": history.progress,

                "watched_at": history.watched_at

            })

    return result


# ==========================================
# Delete History
# ==========================================

def delete_learning_history(
    db: Session,
    history_id: int
):

    history = db.query(LearningHistory).filter(
        LearningHistory.id == history_id
    ).first()

    if not history:

        return {
            "success": False,
            "message": "History not found"
        }

    db.delete(history)
    db.commit()

    return {
        "success": True,
        "message": "History deleted successfully"
    }


# ==========================================
# Clear User History
# ==========================================

def clear_learning_history(
    db: Session,
    user_id: int
):

    db.query(LearningHistory).filter(
        LearningHistory.user_id == user_id
    ).delete()

    db.commit()

    return {
        "success": True,
        "message": "Learning history cleared successfully"
    }