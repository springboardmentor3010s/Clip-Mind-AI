"""
Summary share schemas (Pydantic models).

Represents a shareable link an educator creates for a video summary so
that students/learners can view the summary without needing editor access.
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

class SummaryShareRead(BaseModel):
    """Response schema for a summary share link (owner-facing)."""
    id: int
    video_id: int
    token: str
    is_active: bool
    created_by: int
    created_at: datetime

    model_config = {"from_attributes": True}


class SharedSummaryView(BaseModel):
    """Public payload returned when a student opens a share link."""
    video_id: int
    video_title: str
    educator_name: str
    short_summary: str
    detailed_summary: str
    bullet_points: Optional[List[str]] = None
    shared_at: datetime