"""
Transcript schemas (Pydantic models).
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

class Segment(BaseModel):
    """A single timestamped transcript segment (from Whisper)."""
    id: Optional[int] = None
    start: float = 0.0
    end: float = 0.0
    text: str = ""


class TranscriptBase(BaseModel):
    """Base transcript schema."""
    transcript: str
    language: str = "en"


class TranscriptCreate(TranscriptBase):
    """Schema for creating a transcript."""
    video_id: int


class TranscriptRead(TranscriptBase):
    """Schema for reading a transcript."""
    id: int
    video_id: int
    confidence: Optional[int] = None
    segments: Optional[List[Segment]] = None
    created_at: datetime
    updated_at: datetime
    word_count: Optional[int] = None

    model_config = {"from_attributes": True}


class TranscriptUpdate(BaseModel):
    """Schema for updating a transcript."""
    transcript: Optional[str] = None
    language: Optional[str] = None
    confidence: Optional[int] = None
