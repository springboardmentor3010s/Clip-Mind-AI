"""
Pydantic schemas for the Bookmarks Module.
"""
import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, model_validator


class BookmarkCreate(BaseModel):
    video_id: uuid.UUID
    type: Literal["video", "summary", "highlight"]
    variant: Literal["short", "detailed"] | None = None  # required when type == "summary"
    start: float | None = None  # required when type == "highlight" (identifies which one)

    @model_validator(mode="after")
    def _validate_target_fields(self):
        if self.type == "summary" and self.variant is None:
            raise ValueError("variant is required when bookmarking a summary")
        if self.type == "highlight" and self.start is None:
            raise ValueError("start is required when bookmarking a highlight")
        return self


class BookmarkOut(BaseModel):
    id: str
    video_id: uuid.UUID
    video_title: str
    type: Literal["video", "summary", "highlight"]
    variant: str | None = None
    start: float | None = None
    end: float | None = None
    text: str | None = None
    keywords: list[str] = []
    created_at: datetime