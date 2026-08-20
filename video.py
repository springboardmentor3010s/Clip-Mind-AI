"""
Video schemas (Pydantic models).
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

class VideoBase(BaseModel):
    """Base video schema."""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class VideoCreate(VideoBase):
    """Schema for creating a video (upload)."""
    pass


class VideoRead(VideoBase):
    """Schema for reading a video."""
    id: int
    filename: str
    file_path: str
    file_size: Optional[int] = None
    duration: Optional[float] = None
    thumbnail_url: Optional[str] = None
    thumbnail_path: Optional[str] = None
    audio_path: Optional[str] = None
    video_url: Optional[str] = None
    status: str
    is_published: bool = True
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class VideoUpdate(BaseModel):
    """Schema for updating a video."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_published: Optional[bool] = None


class VideoUploadResponse(BaseModel):
    """Schema for video upload response."""
    id: int
    title: str
    filename: str
    file_size: Optional[int] = None
    status: str
    message: str

    model_config = {"from_attributes": True}
