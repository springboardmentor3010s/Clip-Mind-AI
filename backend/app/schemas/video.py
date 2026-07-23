"""
Pydantic schemas for the Video Upload & Processing Modules.
"""
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.video import VideoStatus


class VideoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    owner_id: uuid.UUID
    filename: str
    title: str | None = None
    description: str | None = None
    file_size_mb: float
    content_type: str
    duration_seconds: int | None = None
    processed_path: str | None = None
    thumbnail_path: str | None = None
    audio_path: str | None = None
    status: VideoStatus
    is_published: bool
    owner_name: str | None = None
    created_at: datetime


class VideoPublishUpdate(BaseModel):
    is_published: bool