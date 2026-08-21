from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.video import Video
from app.services.keyword_service import generate_keywords

router = APIRouter(
    prefix="/keywords",
    tags=["Keywords"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/{video_id}")
def create_keywords(
    video_id: int,
    db: Session = Depends(get_db)
):

    result = generate_keywords(db, video_id)

    if not result["success"]:
        raise HTTPException(
            status_code=404,
            detail=result["message"]
        )

    return {
        "message": "Keywords Generated Successfully",
        "video_id": result["video_id"],
        "keywords": result["keywords"]
    }


@router.get("/{video_id}")
def get_keywords(
    video_id: int,
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

    return {
        "video_id": video.id,
        "title": video.title,
        "keywords": video.keywords or []
    }


@router.put("/{video_id}")
def regenerate_keywords(
    video_id: int,
    db: Session = Depends(get_db)
):

    result = generate_keywords(db, video_id)

    if not result["success"]:
        raise HTTPException(
            status_code=404,
            detail=result["message"]
        )

    return {
        "message": "Keywords Regenerated Successfully",
        "video_id": result["video_id"],
        "keywords": result["keywords"]
    }


@router.delete("/{video_id}")
def delete_keywords(
    video_id: int,
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

    video.keywords = None

    db.commit()

    return {
        "message": "Keywords Deleted Successfully"
    }