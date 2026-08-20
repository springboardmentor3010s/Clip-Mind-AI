"""
Summary validation schemas (Pydantic models).

Mirrors ``transcript_validation.py`` so summaries receive the same
quantitative quality report (``valid`` / ``quality_score`` / ``rating`` /
``metrics`` / ``flags``) as transcripts.
"""
from pydantic import BaseModel


class SummaryValidationMetrics(BaseModel):
    """Quantitative metrics computed from the summary + its source transcript."""
    summary_words: int
    short_summary_words: int
    transcript_words: int
    sentence_count: int
    compression_ratio: float = 0.0
    rouge1: float = 0.0
    rouge2: float = 0.0
    rougeL: float = 0.0
    content_coverage: float = 0.0
    keyword_coverage: float = 0.0
    reading_time_minutes: float = 0.0
    bullet_point_count: int = 0
    uppercase_ratio: float = 0.0


class SummaryValidationFlags(BaseModel):
    """Boolean flags that highlight specific summary quality problems."""
    is_empty: bool = False
    too_short: bool = False
    overlong: bool = False
    poor_compression: bool = False
    low_content_coverage: bool = False
    low_keyword_coverage: bool = False
    no_bullet_points: bool = False
    high_uppercase: bool = False


class SummaryValidationResponse(BaseModel):
    """Full summary accuracy & quality report."""
    valid: bool
    quality_score: int
    rating: str
    metrics: SummaryValidationMetrics
    flags: SummaryValidationFlags
