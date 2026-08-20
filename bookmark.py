from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class VideoMini(BaseModel):
    """Minimal video info returned with bookmark responses."""
    id: int
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration: Optional[float] = None

    class Config:
        from_attributes = True


class BookmarkCreate(BaseModel):
    video_id: int


class BookmarkResponse(BaseModel):
    id: int
    video: VideoMini
    created_at: datetime

    class Config:
        from_attributes = True
