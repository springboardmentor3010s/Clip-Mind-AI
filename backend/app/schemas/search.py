from pydantic import BaseModel
from typing import List, Optional

class SearchResultMatch(BaseModel):
    segment_id: str
    start_time: float
    end_time: float
    text: str

class SearchResultItem(BaseModel):
    video_id: int
    # In a fully integrated app we would also return video title/thumbnail here
    # Since we are focusing on transcript search, we'll return the matches
    matches: List[SearchResultMatch]

class SearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[SearchResultItem]
