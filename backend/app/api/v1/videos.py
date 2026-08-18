"""
Video routes — upload, list, stats, delete, and activity history.
"""

import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.postgres import get_db
from app.models.video import Video, VideoStatus
from app.models.user import User
from app.models.analytics import AnalyticsEvent
from app.core.config import settings
from app.api.deps import get_current_user
from app.services.video_processor import process_video, extract_audio

router = APIRouter()


@router.get("/status")
def videos_status():
    return {"message": "Video module active."}


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_video(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.value == "learner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Learners have view-only access and cannot upload videos.",
        )
    file_ext = file.filename.split(".")[-1].lower()
    if file_ext not in settings.allowed_formats_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported format '.{file_ext}'. Allowed: {', '.join(settings.allowed_formats_list)}",
        )

    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > settings.MAX_UPLOAD_SIZE_MB:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large ({size_mb:.1f}MB). Max allowed is {settings.MAX_UPLOAD_SIZE_MB}MB.",
        )

    os.makedirs(settings.LOCAL_STORAGE_PATH, exist_ok=True)
    unique_name = f"{uuid.uuid4()}.{file_ext}"
    save_path = os.path.join(settings.LOCAL_STORAGE_PATH, unique_name)

    with open(save_path, "wb") as f:
        f.write(contents)

    new_video = Video(
        user_id=current_user.user_id,
        title=file.filename,
        file_path=save_path,
        file_format=file_ext,
        file_size_mb=round(size_mb, 2),
        status=VideoStatus.processing,
    )
    db.add(new_video)
    db.commit()
    db.refresh(new_video)

    result = process_video(save_path, str(new_video.video_id))
    audio_path = extract_audio(save_path, str(new_video.video_id))

    new_video.duration_seconds = result["duration_seconds"]
    new_video.thumbnail_url = result["thumbnail_url"]
    new_video.audio_path = audio_path
    new_video.status = VideoStatus.completed if result["duration_seconds"] else VideoStatus.failed
    db.commit()
    db.refresh(new_video)

    event = AnalyticsEvent(
        user_id=current_user.user_id,
        video_id=new_video.video_id,
        video_title=new_video.title,
        event_type="upload",
    )
    db.add(event)
    db.commit()

    return {
        "video_id": str(new_video.video_id),
        "title": new_video.title,
        "file_format": new_video.file_format,
        "file_size_mb": new_video.file_size_mb,
        "duration_seconds": new_video.duration_seconds,
        "thumbnail_url": new_video.thumbnail_url,
        "status": new_video.status.value,
        "uploaded_at": new_video.uploaded_at,
    }


@router.get("/my-videos")
def get_my_videos(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role.value == "learner":
        # Learners can browse everyone's uploaded videos (view-only)
        videos = db.query(Video).order_by(Video.uploaded_at.desc()).all()
    else:
        videos = db.query(Video).filter(Video.user_id == current_user.user_id).order_by(Video.uploaded_at.desc()).all()

    return [
        {
            "video_id": str(v.video_id),
            "title": v.title,
            "file_format": v.file_format,
            "file_size_mb": v.file_size_mb,
            "duration_seconds": v.duration_seconds,
            "status": v.status.value,
            "uploaded_at": v.uploaded_at,
            "video_url": f"http://localhost:8000/media/videos/{os.path.basename(v.file_path)}" if v.file_path else None,
            "thumbnail_url": f"http://localhost:8000/media/thumbnails/{os.path.basename(v.thumbnail_url)}" if v.thumbnail_url else None,
            "audio_url": f"http://localhost:8000/media/audio/{os.path.basename(v.audio_path)}" if v.audio_path else None,
        }
        for v in videos
    ]

@router.get("/stats")
def get_video_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role.value == "learner":
        videos = db.query(Video).all()
    else:
        videos = db.query(Video).filter(Video.user_id == current_user.user_id).all()
    total = len(videos)
    completed = len([v for v in videos if v.status == VideoStatus.completed])
    processing = len([v for v in videos if v.status == VideoStatus.processing])
    failed = len([v for v in videos if v.status == VideoStatus.failed])
    total_size_mb = round(sum(v.file_size_mb for v in videos), 2)

    durations = [v.duration_seconds for v in videos if v.duration_seconds]
    avg_duration_seconds = round(sum(durations) / len(durations)) if durations else 0

    return {
        "total_videos": total,
        "completed_videos": completed,
        "processing_videos": processing,
        "failed_videos": failed,
        "total_size_mb": total_size_mb,
        "avg_duration_seconds": avg_duration_seconds,
    }


@router.get("/notifications")
def get_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role.value == "admin":
        events = db.query(AnalyticsEvent).order_by(AnalyticsEvent.event_timestamp.desc()).limit(10).all()
    elif current_user.role.value in ("creator", "educator"):
        my_video_ids = [v.video_id for v in db.query(Video).filter(Video.user_id == current_user.user_id).all()]
        events = (
            db.query(AnalyticsEvent)
            .filter(AnalyticsEvent.video_id.in_(my_video_ids))
            .filter(AnalyticsEvent.user_id != current_user.user_id)
            .order_by(AnalyticsEvent.event_timestamp.desc())
            .limit(10)
            .all()
        ) if my_video_ids else []
    else:
        events = (
            db.query(AnalyticsEvent)
            .filter(AnalyticsEvent.user_id == current_user.user_id)
            .order_by(AnalyticsEvent.event_timestamp.desc())
            .limit(10)
            .all()
        )

    result = []
    for e in events:
        actor = db.query(User).filter(User.user_id == e.user_id).first()
        result.append({
            "event_id": str(e.event_id),
            "actor": actor.username if actor else "Someone",
            "event_type": e.event_type,
            "video_title": e.video_title or "a video",
            "timestamp": e.event_timestamp,
        })
    return result


@router.get("/{video_id}")
def get_video(video_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    video = db.query(Video).filter(Video.video_id == video_id).first()
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found.")

    if current_user.role.value != "learner" and video.user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this video.")

    return {
        "video_id": str(video.video_id),
        "title": video.title,
        "file_format": video.file_format,
        "file_size_mb": video.file_size_mb,
        "duration_seconds": video.duration_seconds,
        "status": video.status.value,
        "uploaded_at": video.uploaded_at,
        "video_url": f"http://localhost:8000/media/videos/{os.path.basename(video.file_path)}" if video.file_path else None,
        "thumbnail_url": f"http://localhost:8000/media/thumbnails/{os.path.basename(video.thumbnail_url)}" if video.thumbnail_url else None,
        "audio_url": f"http://localhost:8000/media/audio/{os.path.basename(video.audio_path)}" if video.audio_path else None,
    }


@router.delete("/{video_id}")
def delete_video(video_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    video = db.query(Video).filter(Video.video_id == video_id, Video.user_id == current_user.user_id).first()

    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found.")

    video_title = video.title

    if video.file_path and os.path.exists(video.file_path):
        os.remove(video.file_path)
    if video.thumbnail_url and os.path.exists(video.thumbnail_url):
        os.remove(video.thumbnail_url)
    if video.audio_path and os.path.exists(video.audio_path):
        os.remove(video.audio_path)

    db.delete(video)
    db.commit()

    event = AnalyticsEvent(
        user_id=current_user.user_id,
        video_id=None,
        video_title=video_title,
        event_type="delete",
    )
    db.add(event)
    db.commit()

    return {"message": f'Video "{video_title}" deleted successfully.'}


@router.get("/history/all")
def get_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    events = (
        db.query(AnalyticsEvent)
        .filter(AnalyticsEvent.user_id == current_user.user_id)
        .order_by(AnalyticsEvent.event_timestamp.desc())
        .all()
    )
    return [
        {
            "event_id": str(e.event_id),
            "event_type": e.event_type,
            "video_id": str(e.video_id) if e.video_id else None,
            "video_title": e.video_title or "Unknown video",
            "timestamp": e.event_timestamp,
        }
        for e in events
    ]


@router.delete("/history/entry/{event_id}")
def delete_history_entry(event_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    event = db.query(AnalyticsEvent).filter(
        AnalyticsEvent.event_id == event_id, AnalyticsEvent.user_id == current_user.user_id
    ).first()

    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="History entry not found.")

    db.delete(event)
    db.commit()
    return {"message": "History entry deleted."}


@router.delete("/history/all/clear")
def clear_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(AnalyticsEvent).filter(AnalyticsEvent.user_id == current_user.user_id).delete()
    db.commit()
    return {"message": "All history cleared."}

class LogViewRequest(BaseModel):
    video_id: str


@router.post("/log-view")
def log_video_view(payload: LogViewRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    video = db.query(Video).filter(Video.video_id == payload.video_id).first()
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found.")

    event = AnalyticsEvent(
        user_id=current_user.user_id,
        video_id=video.video_id,
        video_title=video.title,
        event_type="view",
    )
    db.add(event)
    db.commit()
    return {"message": "View logged."}


class UploadFromUrlRequest(BaseModel):
    url: str
    title: str | None = None


@router.post("/upload-from-url", status_code=status.HTTP_201_CREATED)
async def upload_video_from_url(
    payload: UploadFromUrlRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.value == "learner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Learners have view-only access and cannot upload videos.",
        )

    import yt_dlp

    os.makedirs(settings.LOCAL_STORAGE_PATH, exist_ok=True)
    unique_id = str(uuid.uuid4())
    output_template = os.path.join(settings.LOCAL_STORAGE_PATH, f"{unique_id}.%(ext)s")

    ydl_opts = {
        "outtmpl": output_template,
        "format": "mp4/best",
        "quiet": True,
        "noplaylist": True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(payload.url, download=True)
            downloaded_path = ydl.prepare_filename(info)
            video_title = payload.title or info.get("title", "Untitled Video")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not download video from this link: {str(e)}",
        )

    if not os.path.exists(downloaded_path):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Download failed — file not found after processing.",
        )

    file_ext = downloaded_path.split(".")[-1].lower()
    size_mb = os.path.getsize(downloaded_path) / (1024 * 1024)

    if size_mb > settings.MAX_UPLOAD_SIZE_MB:
        os.remove(downloaded_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Video too large ({size_mb:.1f}MB). Max allowed is {settings.MAX_UPLOAD_SIZE_MB}MB.",
        )

    new_video = Video(
        user_id=current_user.user_id,
        title=video_title,
        file_path=downloaded_path,
        file_format=file_ext,
        file_size_mb=round(size_mb, 2),
        status=VideoStatus.processing,
    )
    db.add(new_video)
    db.commit()
    db.refresh(new_video)

    result = process_video(downloaded_path, str(new_video.video_id))
    audio_path = extract_audio(downloaded_path, str(new_video.video_id))

    new_video.duration_seconds = result["duration_seconds"]
    new_video.thumbnail_url = result["thumbnail_url"]
    new_video.audio_path = audio_path
    new_video.status = VideoStatus.completed if result["duration_seconds"] else VideoStatus.failed
    db.commit()
    db.refresh(new_video)

    event = AnalyticsEvent(
        user_id=current_user.user_id,
        video_id=new_video.video_id,
        video_title=new_video.title,
        event_type="upload",
    )
    db.add(event)
    db.commit()

    return {
        "video_id": str(new_video.video_id),
        "title": new_video.title,
        "file_format": new_video.file_format,
        "file_size_mb": new_video.file_size_mb,
        "duration_seconds": new_video.duration_seconds,
        "thumbnail_url": new_video.thumbnail_url,
        "status": new_video.status.value,
        "uploaded_at": new_video.uploaded_at,
    }