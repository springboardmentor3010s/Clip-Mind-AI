"""
Pydantic schemas for the Transcript Generation Module.
"""
import uuid
from datetime import datetime

from pydantic import BaseModel


class TranscriptSegment(BaseModel):
    start: float
    end: float
    text: str


class TranscriptMetrics(BaseModel):
    confidence_score: float | None = None
    avg_no_speech_prob: float | None = None
    segment_count: int
    processing_time_seconds: float


class TranscriptOut(BaseModel):
    video_id: uuid.UUID
    text: str
    segments: list[TranscriptSegment]
    language: str | None = None
    status: str
    edited: bool = False
    metrics: TranscriptMetrics | None = None
    created_at: datetime


class TranscriptUpdate(BaseModel):
    text: str