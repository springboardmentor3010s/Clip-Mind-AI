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
    edited: bool = False
    created_at: datetime


class TranscriptUpdate(BaseModel):
    text: str