from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import User, Video


def get_accessible_video(
    video_id: int,
    current_user: User,
    db: Session,
):
    video = (
        db.query(Video)
        .filter(Video.id == video_id)
        .first()
    )

    if video is None:
        raise HTTPException(
            status_code=404,
            detail="Video not found"
        )

    # Learners can view available videos
    if current_user.role == "learner":
        return video

    # Other roles can access only their own videos
    if video.uploaded_by != current_user.id:
        raise HTTPException(
            status_code=404,
            detail="Video not found"
        )

    return video