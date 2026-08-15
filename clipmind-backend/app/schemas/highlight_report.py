from typing import List

from pydantic import BaseModel


class HighlightItem(BaseModel):
    title: str
    start_time: float
    end_time: float
    duration: float
    importance_score: float
    segment_text: str


class HighlightReportResponse(BaseModel):
    video_id: int
    filename: str
    duration: float
    summary: str
    total_highlights: int
    highlights: List[HighlightItem]