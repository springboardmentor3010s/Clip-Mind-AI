from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.video import Video
from app.services.upload_service import upload_video

router = APIRouter(
    prefix="/videos",
    tags=["Videos"]
)

# ==========================================
# Upload Video
# ==========================================

@router.post("/upload")
def upload(
    user_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a video, generate metadata, thumbnail,
    compressed video and transcript.
    """

    result = upload_video(
        db=db,
        file=file,
        user_id=user_id
    )

    return {
        "message": "Video uploaded successfully",
        "video": result["video"].to_dict(),
        "metadata": result["metadata"],
        "thumbnail": result["thumbnail"],
        "compressed_video": result["compressed"],
        "transcript": result["transcript"]
    }


# ==========================================
# Get All Videos
# ==========================================

@router.get("")
def get_all_videos(
    db: Session = Depends(get_db)
):
    """
    Get all uploaded videos.
    """

    videos = (
        db.query(Video)
        .order_by(Video.created_at.desc())
        .all()
    )

    return [video.to_summary() for video in videos]


# ==========================================
# Get Videos by User
# ==========================================

@router.get("/user/{user_id}")
def get_user_videos(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Get videos uploaded by a specific user.
    """

    videos = (
        db.query(Video)
        .filter(Video.uploaded_by == user_id)
        .order_by(Video.created_at.desc())
        .all()
    )

    return [video.to_summary() for video in videos]


# ==========================================
# Get Single Video
# ==========================================

@router.get("/{video_id}")
def get_video(
    video_id: int,
    db: Session = Depends(get_db)
):
    """
    Get complete details of a single video.
    """

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

    return video.to_dict()