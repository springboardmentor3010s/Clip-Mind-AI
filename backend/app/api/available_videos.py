from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.video import Video

router = APIRouter(
    prefix="/available-videos",
    tags=["Available Videos"]
)


@router.get("/")
def get_available_videos(db: Session = Depends(get_db)):

    videos = db.query(Video).all()

    result = []

    for video in videos:

        result.append({

            "id": video.id,
            "title": video.title,
            "thumbnail": video.thumbnail_path,
            "duration": video.duration,
            "status": video.status,
            "created_at": video.created_at

        })

    return {
        "videos": result
    }