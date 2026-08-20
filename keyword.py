"""
Keyword schemas for request/response validation.
"""

from pydantic import BaseModel, Field

class KeywordExtractRequest(BaseModel):
    """Request body for extracting keywords from a transcript."""

    transcript: str = Field(..., description="The transcript text to extract keywords from")
    top_n: int = Field(default=20, ge=1, le=100, description="Number of top keywords to return")


class KeywordItem(BaseModel):
    """A single extracted keyword with its frequency count."""

    keyword: str
    count: int


class KeywordExtractResponse(BaseModel):
    """Response containing extracted keywords from the transcript."""

    keywords: list[KeywordItem]
    total: int