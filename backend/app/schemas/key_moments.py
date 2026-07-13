"""
Pydantic schemas for the Key Moments Detection Module.
"""
import uuid
from datetime import datetime

from pydantic import BaseModel


class Highlight(BaseModel):
    start: float
    end: float
    text: str
    importance_score: float
    keywords: list[str]


class Topic(BaseModel):
    start: float
    end: float
    label: str
    keywords: list[str]
    segment_count: int


class KeyMomentsMetrics(BaseModel):
    segment_count: int
    highlight_count: int
    topic_count: int
    processing_time_seconds: float


class KeyMomentsOut(BaseModel):
    video_id: uuid.UUID
    keywords: list[str]
    highlights: list[Highlight]
    topics: list[Topic]
    status: str
    metrics: KeyMomentsMetrics | None = None
    created_at: datetime