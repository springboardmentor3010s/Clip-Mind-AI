"""
Learning material schemas (Pydantic models).

Study materials an educator creates from a video transcript:
key terms, flashcards, key takeaways, and a short summary.
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

class KeyTermItem(BaseModel):
    """A single key term with a short definition."""
    term: str
    definition: str = ""


class FlashcardItem(BaseModel):
    """A single flashcard (front question / back answer)."""
    front: str
    back: str = ""


class LearningMaterialContent(BaseModel):
    """The structured content of a learning material."""
    summary: str = ""
    key_terms: List[KeyTermItem] = []
    flashcards: List[FlashcardItem] = []
    takeaways: List[str] = []


class LearningMaterialCreate(BaseModel):
    """Request body for creating a learning material with custom content."""
    title: str
    content: LearningMaterialContent


class LearningMaterialRead(BaseModel):
    """Response schema for a learning material."""
    id: int
    video_id: int
    title: str
    content: LearningMaterialContent
    created_by: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LearningMaterialUpdate(BaseModel):
    """Request body for updating a learning material."""
    title: Optional[str] = None
    content: Optional[LearningMaterialContent] = None