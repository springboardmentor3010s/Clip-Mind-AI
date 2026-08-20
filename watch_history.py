"""
WatchHistory schemas (Pydantic models).
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

class VideoMini(BaseModel):
    """Minimal video info returned with history entries."""
    id: int
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration: Optional[float] = None
    video_url: Optional[str] = None

    model_config = {"from_attributes": True}


class WatchHistoryCreate(BaseModel):
    """Schema for recording/updating a watch-history entry."""
    watch_duration: float = Field(0.0, ge=0, description="Seconds watched")
    completion_rate: float = Field(
        0.0,
        ge=0,
        le=1,
        description="Fraction of the video completed (0.0 - 1.0)",
    )


class WatchHistoryRead(BaseModel):
    """Schema for a single history entry."""
    id: int
    video_id: int
    video: VideoMini
    watch_duration: float
    completion_rate: float
    last_watched_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class ViewerMini(BaseModel):
    """Minimal viewer info returned with creator history entries."""
    id: int
    username: str
    full_name: str
    avatar_url: Optional[str] = None

    model_config = {"from_attributes": True}


class CreatorHistoryRead(BaseModel):
    """Schema for a creator's content history entry.

    Shows how an individual viewer engaged with a video the creator
    uploaded — i.e. the viewer's watch duration, completion rate, and
    who the viewer is.
    """
    id: int
    video_id: int
    video: VideoMini
    viewer: ViewerMini
    watch_duration: float
    completion_rate: float
    last_watched_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}