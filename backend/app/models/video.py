"""
videos table — matches the schema in the Milestone 1 design document.
"""

import uuid
import enum
from sqlalchemy import Column, String, Integer, Float, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.postgres import Base


class VideoStatus(str, enum.Enum):
    uploaded = "uploaded"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class Video(Base):
    __tablename__ = "videos"

    video_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    title = Column(String(255), nullable=False)
    file_path = Column(String, nullable=False)
    file_format = Column(String(10), nullable=False)
    duration_seconds = Column(Integer, nullable=True)
    file_size_mb = Column(Float, nullable=False)
    status = Column(Enum(VideoStatus), default=VideoStatus.uploaded, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    thumbnail_url = Column(String, nullable=True)
    audio_path = Column(String, nullable=True)
    def __repr__(self):
        return f"<Video {self.title} ({self.status})>"