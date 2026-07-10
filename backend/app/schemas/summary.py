"""
Pydantic schemas for the Video Summarization Module.
"""
import uuid
from datetime import datetime

from pydantic import BaseModel


class SummaryOut(BaseModel):
    video_id: uuid.UUID
    short_summary: str
    detailed_summary: str
    status: str
    created_at: datetime