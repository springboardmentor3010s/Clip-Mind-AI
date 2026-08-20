from pydantic import BaseModel, Field
from datetime import datetime
from typing import Literal


class BookmarkCreate(BaseModel):
    content_type: Literal["SUMMARY", "HIGHLIGHT"] = Field(
        ...,
        description="Type of content to bookmark"
    )

    content_id: int = Field(
        ...,
        gt=0,
        description="ID of the summary or highlight being bookmarked"
    )


class BookmarkResponse(BaseModel):
    id: int
    user_id: int
    content_type: str
    content_id: int

    # Video details
    video_id: int | None = None
    video_filename: str | None = None

    # Summary details
    summary_type: str | None = None

    # General content
    content_text: str | None = None

    # Actual generated highlight items
    highlight_items: list[str] | None = None

    created_at: datetime

    class Config:
        from_attributes = True