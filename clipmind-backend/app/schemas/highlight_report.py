from typing import List

from pydantic import BaseModel


class HighlightReportResponse(BaseModel):
    video_id: int
    filename: str
    duration: float
    summary: str
    total_highlights: int
    highlights: List[str]