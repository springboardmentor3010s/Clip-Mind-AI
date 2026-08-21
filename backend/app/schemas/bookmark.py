from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class BookmarkCreate(BaseModel):
    video_id: int
    bookmark_type: str
    content: str
    timestamp: Optional[str] = None


class BookmarkResponse(BaseModel):
    id: int
    video_id: int
    bookmark_type: str
    content: str
    timestamp: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True