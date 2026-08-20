"""
Summary schemas (Pydantic models).
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

class SummaryBase(BaseModel):
    """Base summary schema."""
    short_summary: str
    detailed_summary: str


class SummaryCreate(SummaryBase):
    """Schema for creating a summary."""
    video_id: int
    model_used: Optional[str] = None


class SummaryRead(SummaryBase):
    """Schema for reading a summary."""
    id: int
    video_id: int
    model_used: Optional[str] = None
    bullet_points: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime
    word_count: Optional[int] = None

    model_config = {"from_attributes": True}


class SummaryUpdate(BaseModel):
    """Schema for updating a summary."""
    short_summary: Optional[str] = None
    detailed_summary: Optional[str] = None
    model_used: Optional[str] = None


class SummaryStatusResponse(BaseModel):
    """Schema for returning summary generation status when summary is not ready yet."""
    status: str
    message: str


class RougeScores(BaseModel):
    rouge1: float
    rouge2: float
    rougeL: float


class CompressionMetrics(BaseModel):
    transcript_words: int
    summary_words: int
    compression_ratio: float


class KeywordMetrics(BaseModel):
    total_keywords: int
    matched_keywords: int
    keyword_coverage: float


class ReadingTimeMetrics(BaseModel):
    minutes: int
    label: str


class SentenceMetrics(BaseModel):
    transcript_sentences: int
    summary_sentences: int
    sentence_reduction: float


class OverallScore(BaseModel):
    score: int
    rating: str


class SummaryEvaluationResponse(BaseModel):
    overall_score: OverallScore
    rouge: RougeScores
    compression: CompressionMetrics
    keyword: KeywordMetrics
    reading_time: ReadingTimeMetrics
    sentence: SentenceMetrics
    content_coverage: float
