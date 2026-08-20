"""
Pydantic schemas for the Video Upload & Processing Modules.
"""
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

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


class VideoShareCreate(BaseModel):
    emails: list[EmailStr]


class VideoShareOut(BaseModel):
    id: uuid.UUID
    video_id: uuid.UUID
    user_id: uuid.UUID
    full_name: str
    email: EmailStr
    created_at: datetime


class VideoShareResult(BaseModel):
    shared: list[VideoShareOut]
    not_found: list[str]


class ClassroomShareCreate(BaseModel):
    classroom_id: uuid.UUID


class ClassroomShareOut(BaseModel):
    id: uuid.UUID
    video_id: uuid.UUID
    classroom_id: uuid.UUID
    classroom_name: str
    student_count: int
    shared_by_user_id: uuid.UUID
    created_at: datetime