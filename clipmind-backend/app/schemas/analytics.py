from typing import List

from pydantic import BaseModel


class AnalyticsKeyword(BaseModel):
    keyword: str
    frequency: int
    relevance_score: float


class VideoAnalyticsResponse(BaseModel):

    video_id: int

    # Video information
    duration: float
    file_size: int

    # Transcript analytics
    transcript_available: bool
    transcript_word_count: int
    transcript_segment_count: int

    # Key moment analytics
    key_moment_count: int
    average_key_moment_importance: float
    key_moment_density: float

    # Keyword analytics
    keyword_count: int
    top_keywords: List[AnalyticsKeyword]

    # Summary analytics
    short_summary_available: bool
    detailed_summary_available: bool

    # Content density
    words_per_minute: float