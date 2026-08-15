from typing import List

from pydantic import BaseModel


class UsageKeyword(BaseModel):
    keyword: str
    total_frequency: int


class UsageAnalyticsResponse(BaseModel):

    total_videos: int

    total_video_duration: float

    average_video_duration: float

    total_transcript_words: int

    total_transcript_segments: int

    total_key_moments: int

    total_keywords: int

    total_summaries: int

    average_key_moments_per_video: float

    most_frequent_keywords: List[UsageKeyword]