"""
Video service: handles video upload, processing, and management.
"""
import os
import logging
from typing import Optional, List, Dict, Any
from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.video import Video
from app.models.user import User
from app.schemas.video import VideoCreate, VideoUpdate
from app.services.ffmpeg_service import FFmpegService
from app.utils.file_validator import (
    validate_video_file,
    generate_safe_filename,
    get_file_extension,
)

logger = logging.getLogger(__name__)


class VideoService:
    """Service for video management operations."""

    @staticmethod
    def get_video_by_id(db: Session, video_id: int) -> Optional[Video]:
        """Fetch a video by ID."""
        return db.query(Video).filter(Video.id == video_id).first()

    @staticmethod
    def get_published_videos(db: Session, skip: int = 0, limit: int = 100) -> List[Video]:
        """Get all published videos (the shared library / browse feed)."""
        return (
            db.query(Video)
            .filter(Video.is_published.is_(True))
            .order_by(Video.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def is_accessible(video: Video, user: User) -> bool:
        """Whether a user may read the video: published for all, or
        the video owner."""
        return bool(video and (video.is_published or video.user_id == user.id))

    @staticmethod
    def get_videos_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Video]:
        """Get all videos for a specific user."""
        return (
            db.query(Video)
            .filter(Video.user_id == user_id)
            .order_by(Video.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_all_videos(db: Session, skip: int = 0, limit: int = 100) -> List[Video]:
        """Get all videos (admin)."""
        return db.query(Video).offset(skip).limit(limit).all()

    @staticmethod
    def get_dashboard_stats(db: Session, user_id: int) -> Dict[str, Any]:
        """
        Compute dashboard stat counters for a user in a handful of aggregate
        SQL queries (instead of shipping every video row to the client and
        computing the counters in JavaScript).

        Returns:
            dict: {
                "total_uploads": int,
                "recent_uploads": int,   # created in the last 7 days
                "processing": int,       # videos in a processing state
                "completed": int,        # videos in a ready state
            }
        """
        from datetime import datetime, timedelta

        from sqlalchemy import func

        base = db.query(func.count(Video.id)).filter(Video.user_id == user_id)

        total = base.scalar() or 0

        week_ago = datetime.utcnow() - timedelta(days=7)
        recent = (
            db.query(func.count(Video.id))
            .filter(
                Video.user_id == user_id,
                Video.created_at >= week_ago,
            )
            .scalar()
            or 0
        )

        processing_states = (
            "uploaded",
            "processing",
            "processing_transcript",
            "processing_summary",
        )
        processing = (
            db.query(func.count(Video.id))
            .filter(
                Video.user_id == user_id,
                Video.status.in_(processing_states),
            )
            .scalar()
            or 0
        )

        ready_states = ("processed", "transcripted", "completed")
        completed = (
            db.query(func.count(Video.id))
            .filter(
                Video.user_id == user_id,
                Video.status.in_(ready_states),
            )
            .scalar()
            or 0
        )

        return {
            "total_uploads": total,
            "recent_uploads": recent,
            "processing": processing,
            "completed": completed,
        }

    @staticmethod
    def delete_video(db: Session, video: Video) -> None:
        """Delete a video and its associated files."""
        # Delete video file
        if video.file_path and os.path.exists(video.file_path):
            try:
                os.remove(video.file_path)
            except OSError:
                pass

        # Delete thumbnail
        if video.thumbnail_path and os.path.exists(video.thumbnail_path):
            try:
                os.remove(video.thumbnail_path)
            except OSError:
                pass

        # Delete audio
        if video.audio_path and os.path.exists(video.audio_path):
            try:
                os.remove(video.audio_path)
            except OSError:
                pass

        db.delete(video)
        db.commit()

    @staticmethod
    def upload_video(
        db: Session,
        user: User,
        file: UploadFile,
        title: str,
        description: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Upload and process a video file.

        The file is streamed to disk in 1 MB chunks (never fully loaded into
        memory) while enforcing ``MAX_UPLOAD_SIZE``.  Thumbnail and audio are
        generated directly into the user's upload folder to avoid the extra
        temp-file copy performed by earlier implementations.

        Args:
            db: Database session.
            user: The uploading user.
            file: The uploaded file.
            title: Video title.
            description: Video description.

        Returns:
            Dictionary with upload results.

        Raises:
            ValueError: If the file is invalid (type / size).
        """
        filename = file.filename or ""

        # Validate extension first; the size check happens while streaming.
        is_valid, error = validate_video_file(filename, 1)
        if not is_valid:
            raise ValueError(error)

        # Generate safe filename
        safe_filename = generate_safe_filename(filename, user.id)

        # Ensure upload directory exists
        upload_dir = os.path.join(settings.UPLOAD_DIR, str(user.id))
        os.makedirs(upload_dir, exist_ok=True)

        # Stream the file to disk in chunks (avoid loading the whole file
        # into memory) and enforce the configured max upload size.
        video_path = os.path.join(upload_dir, safe_filename)
        file_size = 0
        max_size = settings.MAX_UPLOAD_SIZE
        chunk_size = 1024 * 1024  # 1 MB

        try:
            with open(video_path, "wb") as out:
                while True:
                    chunk = file.file.read(chunk_size)
                    if not chunk:
                        break
                    file_size += len(chunk)
                    if file_size > max_size:
                        max_mb = max_size / (1024 * 1024)
                        raise ValueError(
                            f"File size exceeds maximum allowed size of {max_mb:.0f} MB"
                        )
                    out.write(chunk)
        except ValueError:
            # Clean up the partially-written file and re-raise
            try:
                if os.path.exists(video_path):
                    os.remove(video_path)
            except OSError:
                pass
            raise
        except Exception:
            try:
                if os.path.exists(video_path):
                    os.remove(video_path)
            except OSError:
                pass
            raise

        # Create thumbnail and audio paths
        thumbnail_filename = safe_filename.rsplit(".", 1)[0] + ".jpg"
        thumbnail_path = os.path.join(upload_dir, thumbnail_filename)
        audio_filename = safe_filename.rsplit(".", 1)[0] + ".wav"
        audio_path = os.path.join(upload_dir, audio_filename)

        # Compute relative filename for URL
        relative_filename = f"uploads/{user.id}/{safe_filename}"

        # Create video record
        video = Video(
            title=title,
            description=description,
            filename=safe_filename,
            file_path=video_path,
            file_size=file_size,
            status="uploaded",
            user_id=user.id,
        )
        # Set video_url using relative path (served via static files mount)
        video.video_url = f"/{relative_filename}"
        db.add(video)
        db.commit()
        db.refresh(video)

        # Process video with FFmpeg (metadata, thumbnail, audio)
        processing_result = {
            "metadata": None,
            "thumbnail_generated": False,
            "audio_extracted": False,
        }

        try:
            # Get video metadata
            info = FFmpegService.get_video_info(video_path)
            video.duration = float(info.get("format", {}).get("duration", 0.0))
            processing_result["metadata"] = info

            # Generate thumbnail directly into the user's upload folder
            try:
                if FFmpegService.is_ffmpeg_available():
                    FFmpegService.generate_thumbnail_to(video_path, thumbnail_path)
                    video.thumbnail_path = thumbnail_path
                    video.thumbnail_url = f"/uploads/{user.id}/{thumbnail_filename}"
                    processing_result["thumbnail_generated"] = True
            except Exception as e:
                logger.warning(f"Thumbnail generation failed: {e}")

            # Extract audio directly into the user's upload folder
            try:
                if FFmpegService.is_ffmpeg_available():
                    FFmpegService.extract_audio_to(video_path, audio_path)
                    video.audio_path = audio_path
                    processing_result["audio_extracted"] = True
            except Exception as e:
                logger.warning(f"Audio extraction failed: {e}")

        except Exception as e:
            logger.warning(f"FFmpeg processing failed: {e}")

        video.status = "processed"
        db.add(video)
        db.commit()
        db.refresh(video)

        return {
            "video": video,
            "processing": processing_result,
        }

    @staticmethod
    def update_video(
        db: Session,
        video: Video,
        payload: VideoUpdate,
    ) -> Video:
        """Update a video's metadata."""
        update_data = payload.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(video, field, value)
        db.add(video)
        db.commit()
        db.refresh(video)
        return video
