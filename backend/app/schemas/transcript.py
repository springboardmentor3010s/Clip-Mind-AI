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


class TranscriptOut(BaseModel):
    video_id: uuid.UUID
    text: str
    segments: list[TranscriptSegment]
    language: str | None = None
    status: str
    created_at: datetime