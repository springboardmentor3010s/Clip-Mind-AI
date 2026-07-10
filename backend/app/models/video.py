"""
Video model — core of the Video Upload & Processing Modules.
Tracks uploaded videos, ownership, storage location, processing outputs,
and status.
"""
import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Integer, Float, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class VideoStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class Video(Base):
    __tablename__ = "videos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    filename = Column(String(255), nullable=False)
    title = Column(String(255), nullable=True)
    description = Column(String(2000), nullable=True)
    stored_filename = Column(String(255), nullable=False, unique=True)
    file_path = Column(String(500), nullable=False)
    file_size_mb = Column(Float, nullable=False)
    content_type = Column(String(100), nullable=False)
    duration_seconds = Column(Integer, nullable=True)

    # --- Video Processing Module outputs ---
    processed_path = Column(String(500), nullable=True)   # standardized MP4 (H.264/AAC)
    thumbnail_path = Column(String(500), nullable=True)    # extracted key frame (JPG)
    audio_path = Column(String(500), nullable=True)         # denoised audio track (WAV, 16kHz mono)

    status = Column(Enum(VideoStatus), nullable=False, default=VideoStatus.UPLOADED)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self) -> str:
        return f"<Video id={self.id} filename={self.filename} status={self.status}>"