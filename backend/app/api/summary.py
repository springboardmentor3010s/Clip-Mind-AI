from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.services.summary_service import generate_summary

router = APIRouter(
    prefix="/summary",
    tags=["AI Summary"]
)


# ==========================
# Database Dependency
# ==========================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==========================
# Generate AI Summary
# ==========================

@router.post("/{video_id}")
def generate_video_summary(
    video_id: int,
    db: Session = Depends(get_db)
):
    """
    Generate AI summary for a video using its transcript.
    """

    result = generate_summary(db, video_id)

    if not result["success"]:
        raise HTTPException(
            status_code=404,
            detail=result["message"]
        )

    return {
        "message": "Summary generated successfully.",
        "video_id": result["video_id"],
        "summary": result["summary"]
    }


# ==========================
# Get Existing Summary
# ==========================

@router.get("/{video_id}")
def get_video_summary(
    video_id: int,
    db: Session = Depends(get_db)
):
    """
    Fetch previously generated summary.
    """

    from app.models.video import Video

    video = (
        db.query(Video)
        .filter(Video.id == video_id)
        .first()
    )

    if not video:
        raise HTTPException(
            status_code=404,
            detail="Video not found."
        )

    if not video.summary:
        raise HTTPException(
            status_code=404,
            detail="Summary not generated yet."
        )

    return {
        "video_id": video.id,
        "title": video.title,
        "summary": video.summary,
        "status": video.status
    }


# ==========================
# Regenerate Summary
# ==========================

@router.put("/{video_id}")
def regenerate_summary(
    video_id: int,
    db: Session = Depends(get_db)
):
    """
    Regenerate AI summary.
    """

    result = generate_summary(db, video_id)

    if not result["success"]:
        raise HTTPException(
            status_code=404,
            detail=result["message"]
        )

    return {
        "message": "Summary regenerated successfully.",
        "summary": result["summary"]
    }