from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class BookmarkCreate(BaseModel):
    video_id: int
    target_type: str = "video"  # "video" | "summary" | "key_moment"
    target_id: Optional[int] = None
    note: Optional[str] = None


class BookmarkResponse(BaseModel):
    id: int
    video_id: int
    video_title: Optional[str] = None
    target_type: str
    target_id: Optional[int] = None
    note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
