from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, require_content_manager
from app.core.cache import cache_delete
from app.core.audit import record_audit_event
from app.core.platform_settings_store import get_platform_settings
from app.models.user import User
from app.models.video import Video, VideoStatus
from app.models.transcript import Transcript
from app.models.summary import Summary
from app.models.key_moment import KeyMoment
from app.models.analytics import AnalyticsEvent
from app.schemas.video import (
    VideoCreate,
    VideoUpdate,
    MultipartUploadInitResponse,
    MultipartUploadPartRequest,
    MultipartUploadPartResponse,
    MultipartUploadCompleteRequest,
    VideoResponse
)
from app.services import r2_storage
from app.services.transcription import process_video_transcription
import logging
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/upload", tags=["upload"])

@router.post("/multipart/init", response_model=MultipartUploadInitResponse)
def init_multipart_upload(video_in: VideoCreate, db: Session = Depends(get_db), current_user: User = Depends(require_content_manager)):
    """Initialize a multipart upload and save the pending video to the database."""
    settings = get_platform_settings(db)
    if settings.maintenance_mode and current_user.role.name != "Administrator":
        raise HTTPException(status_code=503, detail="The platform is in maintenance mode. Uploads are temporarily disabled.")
    if video_in.file_size_bytes and video_in.file_size_bytes > settings.max_upload_size_mb * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds the platform's {settings.max_upload_size_mb}MB upload limit.",
        )

    s3_key = f"videos/{uuid.uuid4()}/{video_in.filename}"
    
    try:
        upload_id = r2_storage.create_multipart_upload(s3_key, video_in.file_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize upload: {str(e)}")

    video = Video(
        title=video_in.title,
        filename=video_in.filename,
        s3_key=s3_key,
        upload_id=upload_id,
        status=VideoStatus.UPLOADING
    )
    
    db.add(video)
    db.commit()
    db.refresh(video)
    
    return MultipartUploadInitResponse(
        video_id=video.id,
        upload_id=upload_id,
        s3_key=s3_key
    )

@router.post("/multipart/presigned-urls", response_model=MultipartUploadPartResponse)
def get_presigned_urls(req: MultipartUploadPartRequest):
    """Get presigned URLs for specific parts of the multipart upload."""
    try:
        urls = r2_storage.generate_presigned_urls_for_parts(req.s3_key, req.upload_id, req.part_numbers)
        return MultipartUploadPartResponse(presigned_urls=urls)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate urls: {str(e)}")

@router.post("/multipart/complete", response_model=VideoResponse)
def complete_upload(req: MultipartUploadCompleteRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Complete the multipart upload and update the video status to UPLOADED."""
    video = db.query(Video).filter(Video.id == req.video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
        
    parts = [{"ETag": part.ETag, "PartNumber": part.PartNumber} for part in req.parts]
    
    try:
        r2_storage.complete_multipart_upload(req.s3_key, req.upload_id, parts)
    except Exception as e:
        video.status = VideoStatus.FAILED
        db.commit()
        raise HTTPException(status_code=500, detail=f"Failed to complete upload: {str(e)}")

    video.status = VideoStatus.UPLOADED
    db.commit()
    db.refresh(video)
    
    # Trigger Whisper transcription in background
    background_tasks.add_task(process_video_transcription, video.id)
    
    return video

@router.post("/multipart/abort")
def abort_upload(video_id: int, db: Session = Depends(get_db)):
    """Abort the multipart upload."""
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
        
    try:
        r2_storage.abort_multipart_upload(video.s3_key, video.upload_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to abort upload: {str(e)}")

    video.status = VideoStatus.FAILED
    db.commit()
    
    return {"message": "Upload aborted successfully"}

@router.get("/videos", response_model=list[VideoResponse])
def list_videos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List uploaded videos, newest first. `limit` is capped at 200 per page
    so a large library can't force one unbounded query."""
    limit = min(limit, 200)
    videos = db.query(Video).order_by(Video.created_at.desc()).offset(skip).limit(limit).all()
    return videos

@router.get("/video/{video_id}", response_model=VideoResponse)
def get_video(video_id: int, db: Session = Depends(get_db)):
    """Get video details by ID including presigned video playback URL."""
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    url = None
    if video.s3_key:
        try:
            url = r2_storage.generate_presigned_download_url(video.s3_key)
        except Exception:
            pass

    return VideoResponse(
        id=video.id,
        title=video.title,
        filename=video.filename,
        status=video.status,
        duration_seconds=video.duration_seconds or 0,
        file_size_bytes=video.file_size_bytes or 0,
        url=url,
        created_at=video.created_at
    )

@router.patch("/video/{video_id}", response_model=VideoResponse)
def rename_video(video_id: int, req: VideoUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_content_manager)):
    """Renames a video's display title."""
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    video.title = req.title
    db.commit()
    db.refresh(video)

    url = None
    if video.s3_key:
        try:
            url = r2_storage.generate_presigned_download_url(video.s3_key)
        except Exception:
            pass

    return VideoResponse(
        id=video.id,
        title=video.title,
        filename=video.filename,
        status=video.status,
        duration_seconds=video.duration_seconds or 0,
        file_size_bytes=video.file_size_bytes or 0,
        url=url,
        created_at=video.created_at
    )

@router.delete("/video/{video_id}")
def delete_video(video_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_content_manager)):
    """Deletes a video and everything derived from it: transcript, summary,
    key moments, analytics events, and the R2-stored file."""
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    if video.s3_key:
        try:
            r2_storage.delete_object(video.s3_key)
        except Exception as e:
            logger.error(f"Failed to delete R2 object for video {video_id}: {e}")

    db.query(AnalyticsEvent).filter(AnalyticsEvent.video_id == video_id).delete()
    db.query(KeyMoment).filter(KeyMoment.video_id == video_id).delete()
    db.query(Summary).filter(Summary.video_id == video_id).delete()
    db.query(Transcript).filter(Transcript.video_id == video_id).delete()
    video_title = video.title
    db.delete(video)
    db.commit()
    cache_delete(f"transcript:{video_id}", f"summary:{video_id}")
    record_audit_event(
        db, current_user.id, "video_deleted", target_type="video", target_id=video_id,
        detail=video_title,
    )

    return {"message": "Video and all associated data deleted successfully."}

