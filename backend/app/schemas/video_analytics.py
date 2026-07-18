"""
Pydantic schemas for per-video watch tracking and analytics.
"""
from datetime import datetime

from pydantic import BaseModel, Field


class ViewPing(BaseModel):
    watched_seconds: float = Field(ge=0)
    session_start: bool = False


class RetentionBucket(BaseModel):
    label: str
    viewers_reached: int


class AudienceMember(BaseModel):
    viewer_id: str
    viewer_name: str
    view_count: int
    watched_seconds: float
    completion_pct: float
    last_watched_at: datetime


class VideoAnalytics(BaseModel):
    video_id: str
    view_count: int
    unique_viewers: int
    total_watch_time_seconds: float
    avg_watch_time_seconds: float
    completion_rate: float
    retention: list[RetentionBucket]
    audience: list[AudienceMember]