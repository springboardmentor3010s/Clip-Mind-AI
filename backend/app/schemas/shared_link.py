from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class SharedLinkCreate(BaseModel):
    video_id: int


class SharedLinkResponse(BaseModel):
    id: int
    video_id: int
    token: str
    created_at: datetime

    class Config:
        from_attributes = True


class SharedContentResponse(BaseModel):
    """What an unauthenticated student sees when they open a share link —
    read-only, no edit/regenerate/delete affordances."""
    video_title: str
    duration_seconds: int
    summary_short: Optional[str] = None
    summary_detailed: Optional[str] = None
    key_moments: List[Dict[str, Any]] = []
    keywords: List[str] = []
    shared_by: str
