"""
Pydantic schemas for the Video Summarization Module.
"""
import uuid
from datetime import datetime

from pydantic import BaseModel


class SummaryMetrics(BaseModel):
    transcript_word_count: int
    detailed_summary_word_count: int
    short_summary_word_count: int
    detailed_compression_ratio: float | None = None
    short_compression_ratio: float | None = None
    groundedness_score: float | None = None
    processing_time_seconds: float


class SummaryOut(BaseModel):
    video_id: uuid.UUID
    short_summary: str
    detailed_summary: str
    status: str
    metrics: SummaryMetrics | None = None
    created_at: datetime