from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.video import Video
from app.models.learning_history import LearningHistory

router = APIRouter(
    prefix="/watch-video",
    tags=["Watch Video"]
)


# ==========================================
# Get Video Details
# ==========================================

@router.get("/{video_id}")
def watch_video(
    video_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):

    video = db.query(Video).filter(
        Video.id == video_id
    ).first()

    if not video:
        raise HTTPException(
            status_code=404,
            detail="Video not found"
        )

    # Update learning history
    history = db.query(LearningHistory).filter(
        LearningHistory.user_id == user_id,
        LearningHistory.video_id == video_id
    ).first()

    if history:

        history.progress = 100

    else:

        history = LearningHistory(
            user_id=user_id,
            video_id=video_id,
            progress=100
        )

        db.add(history)

    db.commit()

    return {

        "id": video.id,

        "title": video.title,

        "description": getattr(video, "description", ""),

        "video_url": f"/uploads/{video.file_path}",

        "thumbnail": f"/uploads/{video.thumbnail_path}",

        "duration": video.duration,

        "status": video.status

    }