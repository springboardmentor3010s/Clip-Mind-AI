from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class AnalyticsEventCreate(BaseModel):
    video_id: Optional[int] = None
    event_type: str
    metadata_val: Optional[str] = None

class AnalyticsEventResponse(BaseModel):
    id: int
    video_id: Optional[int]
    user_id: Optional[int]
    event_type: str
    metadata_val: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

class DashboardMetricsResponse(BaseModel):
    total_videos: int = 0
    total_views: int = 0
    total_exports: int = 0
    avg_processing_time_seconds: float = 0.0
    events_timeline: List[Dict[str, Any]] = []
    videos_uploaded_today: int = 0
    videos_uploaded_yesterday: int = 0
    downloads_today: int = 0
    downloads_yesterday: int = 0
    rolling_8_day: List[Dict[str, Any]] = []
    total_keywords: int = 0
    total_key_moments: int = 0
    videos_by_status: Dict[str, int] = {}
    avg_views_per_video: float = 0.0

class VideoAnalyticsResponse(BaseModel):
    video_id: int
    views: int = 0
    unique_viewers: int = 0
    exports: int = 0
    exports_by_type: Dict[str, int] = {}
    keyword_count: int = 0
    key_moment_count: int = 0
    processing_time_seconds: Optional[float] = None

