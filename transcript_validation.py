"""
Transcript validation schemas (Pydantic models).
"""
from typing import Optional

from pydantic import BaseModel

class TranscriptValidationMetrics(BaseModel):
    """Quantitative metrics computed from the transcript + video."""
    word_count: int
    sentence_count: int
    average_confidence: Optional[float] = None
    min_confidence: Optional[float] = None
    segments_with_confidence: int = 0
    total_segments: int = 0
    speaking_speed: Optional[float] = None
    duration_coverage: Optional[float] = None
    filler_word_count: int = 0
    filler_word_ratio: float = 0.0
    empty_segment_count: int = 0
    empty_segment_ratio: float = 0.0
    uppercase_ratio: float = 0.0


class TranscriptValidationFlags(BaseModel):
    """Boolean flags that flag specific accuracy problems."""
    is_empty: bool = False
    too_short: bool = False
    very_fast: bool = False
    low_confidence: bool = False
    high_filler_ratio: bool = False
    poor_coverage: bool = False
    high_uppercase: bool = False


class TranscriptValidationResponse(BaseModel):
    """Full transcript accuracy & quality report."""
    valid: bool
    quality_score: int
    rating: str
    metrics: TranscriptValidationMetrics
    flags: TranscriptValidationFlags
