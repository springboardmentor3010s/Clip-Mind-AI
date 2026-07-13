"""
Pydantic schemas for the Analytics Dashboard Module.
"""
from datetime import datetime

from pydantic import BaseModel


class StatusBreakdown(BaseModel):
    status: str
    count: int


class UploadTrendPoint(BaseModel):
    period: str
    count: int


class TopKeyword(BaseModel):
    keyword: str
    count: int


class AnalyticsOverview(BaseModel):
    scope: str  # "own" (content creator / educator) | "platform" (administrator)
    total_videos: int
    completed_videos: int
    processing_videos: int
    failed_videos: int
    completion_rate: float
    total_duration_seconds: int
    total_duration_hours: float
    total_storage_mb: float
    avg_duration_seconds: float
    status_breakdown: list[StatusBreakdown]
    uploads_over_time: list[UploadTrendPoint]
    top_keywords: list[TopKeyword]
    generated_at: datetime