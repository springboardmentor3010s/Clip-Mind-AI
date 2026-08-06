import os
import uuid
import shutil
import json
from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File,
    Form,
    BackgroundTasks,
)

from app.core.security import (
    verify_password,
    hash_password
)

from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.postgres import get_db
from app.models.video import Video

from app.services.processing_service import process_uploaded_video
from app.models.transcript import Transcript
from app.models.user import User
from pydantic import BaseModel


router = APIRouter(
    prefix="/creator",
    tags=["Creator"]
)


UPLOAD_FOLDER = "uploads/videos"

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)
class UpdateUsernameRequest(BaseModel):

    username: str

class ChangePasswordRequest(BaseModel):

    current_password: str

    new_password: str

    confirm_password: str
    
    
@router.put("/change-password/{user_id}")

def change_password(

    user_id: int,

    request: ChangePasswordRequest,

    db: Session = Depends(get_db)

):

    user = (

        db.query(User)

        .filter(User.id == user_id)

        .first()

    )

    if not user:

        raise HTTPException(

            status_code=404,

            detail="User not found"

        )

    if not verify_password(

        request.current_password,

        user.password

    ):

        raise HTTPException(

            status_code=400,

            detail="Current password is incorrect"

        )

    if request.new_password != request.confirm_password:

        raise HTTPException(

            status_code=400,

            detail="Passwords do not match"

        )

    user.password = hash_password(

        request.new_password

    )

    db.commit()

    return {

        "message": "Password updated successfully"

    }
    
    
@router.get("/profile/{user_id}")

def get_profile(

    user_id: int,

    db: Session = Depends(get_db)

):

    user = (

        db.query(User)

        .filter(User.id == user_id)

        .first()

    )

    if not user:

        return {

            "message": "User not found"

        }

    return {

        "username": user.username,

        "email": user.email,

        "role": user.role,

        "member_since": user.created_at

    }
    
@router.put("/profile/{user_id}")

def update_username(

    user_id: int,

    request: UpdateUsernameRequest,

    db: Session = Depends(get_db)

):

    user = (

        db.query(User)

        .filter(User.id == user_id)

        .first()

    )

    if not user:

        return {

            "message": "User not found"

        }

    existing = (

        db.query(User)

        .filter(User.username == request.username)

        .first()

    )

    if existing and existing.id != user.id:

        return {

            "message": "Username already exists"

        }

    user.username = request.username

    db.commit()

    db.refresh(user)

    return {

        "message": "Username updated successfully"

    }
# ---------------------------------------------------
# Upload Video
# ---------------------------------------------------
@router.post("/upload")
async def upload_video(

    background_tasks: BackgroundTasks,

    title: str = Form(...),

    description: str = Form(""),

    category: str = Form(""),

    course_id: str = Form(None),

    user_id: int = Form(...),

    video: UploadFile = File(...),

    db: Session = Depends(get_db),

):

    extension = os.path.splitext(video.filename)[1]

    unique_filename = f"{uuid.uuid4()}{extension}"

    filepath = os.path.join(
        UPLOAD_FOLDER,
        unique_filename
    )

    with open(filepath, "wb") as buffer:

        shutil.copyfileobj(
            video.file,
            buffer
        )

    file_size = os.path.getsize(filepath)

    # -----------------------------
    # Creator uploads don't send a course.
    # Educator uploads do.
    # -----------------------------
    if course_id in ("", None, "null"):

        course_id = None

    else:

        course_id = int(course_id)

    new_video = Video(

        title=title,

        description=description,

        category=category,

        course_id=course_id,

        original_filename=video.filename,

        filename=unique_filename,

        file_size=file_size,

        file_type=video.content_type,

        duration=None,

        thumbnail=None,

        transcript_path=None,

        summary=None,

        user_id=user_id,

        status="Uploaded",

        processing_stage="Waiting",

        progress=0

    )

    db.add(new_video)

    db.commit()

    db.refresh(new_video)

    background_tasks.add_task(

        process_uploaded_video,

        new_video.id,

        filepath

    )

    return {

        "message": "Video Uploaded Successfully",

        "video_id": new_video.id,

        "status": "Processing"

    }
@router.get("/analytics/{video_id}")
def get_analytics(
    video_id: int,
    db: Session = Depends(get_db)
):

    video = (
        db.query(Video)
        .filter(Video.id == video_id)
        .first()
    )

    if not video:
        return {
            "message": "Video not found"
        }

    transcript_words = 0
    summary_words = 0
    key_moments = 0
    topics = 0
    quiz = 0
    flashcards = 0

    # Transcript
    transcript = (
        db.query(Transcript)
        .filter(Transcript.video_id == video_id)
        .first()
    )

    if transcript:
        transcript_words = len(
            transcript.transcript_text.split()
        )

    # Summary
    if video.summary:
        summary_words = len(
            video.summary.split()
        )

    # Topics
    if video.topics:
        topics = len(json.loads(video.topics))

    # Key Moments
    if video.key_moments:
        key_moments = len(json.loads(video.key_moments))

    # Quiz
    if video.quiz:
        quiz = len(json.loads(video.quiz))

    # Flashcards
    if video.flashcards:
        flashcards = len(json.loads(video.flashcards))

    return {

        "duration": video.duration,

        "transcript_words": transcript_words,

        "summary_words": summary_words,

        "topics": topics,

        "key_moments": key_moments,

        "quiz": quiz,

        "flashcards": flashcards
    }
    
@router.get("/dashboard/{user_id}")
def dashboard_stats(
    user_id: int,
    db: Session = Depends(get_db)
):

    videos = (
        db.query(Video)
        .filter(Video.user_id == user_id)
        .all()
    )

    total_videos = len(videos)

    summaries = sum(
        1 for v in videos
        if v.summary
    )

    transcripts = (
        db.query(Transcript)
        .join(Video, Transcript.video_id == Video.id)
        .filter(Video.user_id == user_id)
        .count()
    )

    total_size = sum(
        (v.file_size or 0)
        for v in videos
    )

    if total_size < 1024:
        storage = f"{total_size} B"

    elif total_size < 1024**2:
        storage = f"{total_size/1024:.2f} KB"

    elif total_size < 1024**3:
        storage = f"{total_size/(1024**2):.2f} MB"

    else:
        storage = f"{total_size/(1024**3):.2f} GB"

    return {

        "videos": total_videos,

        "summaries": summaries,

        "transcripts": transcripts,

        "storage": storage

    }
    
@router.post("/video/{video_id}/view")
def add_view(
    video_id:int,
    db:Session=Depends(get_db)
):

    video=(
        db.query(Video)
        .filter(Video.id==video_id)
        .first()
    )

    if not video:

        return{
            "message":"Video not found"
        }

    video.views += 1

    db.commit()

    return{
        "views":video.views
    }
# ---------------------------------------------------
# Processing Status
# ---------------------------------------------------
@router.get("/video-status/{video_id}")
def get_status(

    video_id: int,

    db: Session = Depends(get_db)

):

    video = (

        db.query(Video)

        .filter(Video.id == video_id)

        .first()

    )

    if not video:

        return {

            "message": "Video not found"

        }

    return {

        "status": video.status,

        "stage": video.processing_stage,

        "progress": video.progress

    }

@router.get("/summary/{video_id}")

def get_summary(

    video_id:int,

    db:Session=Depends(get_db)

):

    video=(

        db.query(Video)

        .filter(Video.id==video_id)

        .first()

    )

    if video is None:

        return{

            "message":"Video not found"

        }

    return{

        "summary":video.summary

    }

# ---------------------------------------------------
# My Videos
# ---------------------------------------------------
@router.get("/videos")
def get_videos(

    user_id: int,

    db: Session = Depends(get_db)

):

    videos = (

        db.query(Video)

        .filter(

            Video.user_id == user_id

        )

        .order_by(

            Video.uploaded_at.desc()

        )

        .all()

    )

    return videos


# ---------------------------------------------------
# Single Video
# ---------------------------------------------------
@router.get("/video/{video_id}")
def get_video(

    video_id: int,

    db: Session = Depends(get_db)

):

    video = (

        db.query(Video)

        .filter(

            Video.id == video_id

        )

        .first()

    )

    if not video:

        return {

            "message": "Video not found"

        }

    return video


# ---------------------------------------------------
# Delete Video
# ---------------------------------------------------
@router.delete("/video/{video_id}")
def delete_video(

    video_id: int,

    db: Session = Depends(get_db)

):

    video = (

        db.query(Video)

        .filter(Video.id == video_id)

        .first()

    )

    if not video:

        return {

            "message": "Video not found"

        }

    # Delete transcript first

    transcript = (

        db.query(Transcript)

        .filter(Transcript.video_id == video.id)

        .first()

    )

    if transcript:

        db.delete(transcript)

    filepath = os.path.join(

        UPLOAD_FOLDER,

        video.filename

    )

    if os.path.exists(filepath):

        os.remove(filepath)

    db.delete(video)

    db.commit()

    return {

        "message": "Video deleted successfully"

    }
    
@router.get("/keymoments/{video_id}")
def get_key_moments(
    video_id: int,
    db: Session = Depends(get_db)
):

    video = (
        db.query(Video)
        .filter(Video.id == video_id)
        .first()
    )

    if not video:
        return {
            "message": "Video not found"
        }

    return json.loads(video.key_moments)

@router.get("/topics/{video_id}")
def get_topics(
    video_id: int,
    db: Session = Depends(get_db)
):

    video = (
        db.query(Video)
        .filter(Video.id == video_id)
        .first()
    )

    if not video:
        return {
            "message": "Video not found"
        }

    return json.loads(video.topics)

@router.get("/quiz/{video_id}")
def get_quiz(
    video_id: int,
    db: Session = Depends(get_db)
):

    video = (
        db.query(Video)
        .filter(Video.id == video_id)
        .first()
    )

    if not video:
        return {
            "message": "Video not found"
        }

    return json.loads(video.quiz)

@router.get("/flashcards/{video_id}")
def get_flashcards(
    video_id: int,
    db: Session = Depends(get_db)
):

    video = (
        db.query(Video)
        .filter(Video.id == video_id)
        .first()
    )

    if not video:
        return {
            "message": "Video not found"
        }

    return json.loads(video.flashcards)