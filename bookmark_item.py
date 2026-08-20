"""
BookmarkItem schemas (Pydantic models).

Used to bookmark individual pieces of content ("highlights") such as
AI summaries and key-moment chapters.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.bookmark_item import VALID_BOOKMARK_ITEM_TYPES

class BookmarkItemCreate(BaseModel):
    """Schema for saving a content item."""
    item_type: str = Field(
        ...,
        description=f"One of: {', '.join(VALID_BOOKMARK_ITEM_TYPES)}",
    )
    item_id: int = Field(..., ge=1)
    label: Optional[str] = Field(
        None,
        max_length=500,
        description="Optional user label / note for the saved item",
    )


class BookmarkItemDetail(BaseModel):
    """Schema returned when listing saved content items."""
    id: int
    item_type: str
    item_id: int
    label: Optional[str] = None
    created_at: datetime

    # Denormalized details for rendering the saved item.
    video_id: int
    video_title: str
    video_thumbnail_url: Optional[str] = None

    # The saved item's own title (chapter title / summary section name).
    title: str
    preview: Optional[str] = None

    # Where the item lives inside the app.
    link: str


class BookmarkItemStatus(BaseModel):
    """Schema for checking whether an item is saved."""
    bookmarked: bool