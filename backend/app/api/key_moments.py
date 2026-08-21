import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.video import Video
from app.services.keymoment_service import generate_key_moments

router = APIRouter(
    prefix="/key-moments",
    tags=["Key Moments"]
)

# ==========================================
# Database Dependency
# ==========================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==========================================
# Generate Key Moments
# ==========================================

@router.post("/{video_id}")
def create_key_moments(
    video_id: int,
    db: Session = Depends(get_db)
):

    result = generate_key_moments(db, video_id)

    if not result["success"]:
        raise HTTPException(
            status_code=404,
            detail=result["message"]
        )

    return {
        "message": "Key Moments Generated Successfully",
        "video_id": result["video_id"],
        "key_moments": result["key_moments"]
    }


# ==========================================
# Get Key Moments
# ==========================================

@router.get("/{video_id}")
def get_key_moments(
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

    key_moments = []

    if video.key_moments:

        try:

            # If stored as JSON string
            if isinstance(video.key_moments, str):
                key_moments = json.loads(video.key_moments)

            # If already stored as Python list
            elif isinstance(video.key_moments, list):
                key_moments = video.key_moments

            # If SQLAlchemy JSON object
            elif isinstance(video.key_moments, dict):
                key_moments = [video.key_moments]

        except Exception:
            key_moments = []

    return {
        "video_id": video.id,
        "title": video.title,
        "key_moments": key_moments
    }


# ==========================================
# Regenerate Key Moments
# ==========================================

@router.put("/{video_id}")
def regenerate_key_moments(
    video_id: int,
    db: Session = Depends(get_db)
):

    result = generate_key_moments(db, video_id)

    if not result["success"]:
        raise HTTPException(
            status_code=404,
            detail=result["message"]
        )

    return {
        "message": "Key Moments Regenerated Successfully",
        "video_id": result["video_id"],
        "key_moments": result["key_moments"]
    }


# ==========================================
# Delete Key Moments
# ==========================================

@router.delete("/{video_id}")
def delete_key_moments(
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

    video.key_moments = None

    db.commit()

    return {
        "message": "Key Moments Deleted Successfully"
    }


# ==========================================
# Check Key Moments (Debug API)
# ==========================================

@router.get("/debug/{video_id}")
def debug_key_moments(
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
        "python_type": str(type(video.key_moments)),
        "raw_value": video.key_moments
    }