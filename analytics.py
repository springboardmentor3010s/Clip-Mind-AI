"""
Analytics schemas (Pydantic models).
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field



class AnalyticsBase(BaseModel):
    """Base analytics schema."""
    views: int = 0
    watch_time: float = 0.0
    unique_viewers: int = 0
    avg_watch_duration: float = 0.0
    completion_rate: float = 0.0
    total_watch_time: float = 0.0


class AnalyticsCreate(AnalyticsBase):
    """Schema for creating analytics."""
    video_id: int


class AnalyticsRead(AnalyticsBase):
    """Schema for reading analytics."""
    id: int
    video_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AnalyticsUpdate(BaseModel):
    """Schema for updating analytics."""
    views: Optional[int] = None
    watch_time: Optional[float] = None
    unique_viewers: Optional[int] = None
    avg_watch_duration: Optional[float] = None
    completion_rate: Optional[float] = None
    total_watch_time: Optional[float] = None


class RichAnalyticsRead(AnalyticsBase):
    """
    Extended analytics response that includes AI content statistics
    computed from the video's transcript and summary data.
    """
    id: int
    video_id: int
    created_at: datetime
    updated_at: datetime

    # AI Content statistics (computed server-side)
    transcript_word_count: int = 0
    summary_word_count: int = 0
    compression_ratio: int = 0
    key_moment_count: int = 0
    average_confidence: int = 0
    bookmark_count: int = 0
    keyword_count: int = 0

    # AI Insights Engine fields
    speaking_speed: float = 0.0
    reading_time: float = 0.0
    processing_score: float = 0.0
    video_quality: str = "Needs Improvement"
    summary_quality: str = "Needs Improvement"
    transcript_density: float = 0.0
    top_keywords: list = Field(default_factory=list)

    model_config = {"from_attributes": True}
