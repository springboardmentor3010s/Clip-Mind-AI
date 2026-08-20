"""
KeyMoment Pydantic schemas.

Updated to support YouTube-style chapters with importance field.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

class KeyMomentBase(BaseModel):
    """
    Base schema for a key moment (YouTube-style chapter).
    """

    start_time: float = Field(
        ...,
        ge=0,
        description="Start timestamp (seconds) in the video."
    )

    end_time: float | None = Field(
        default=None,
        ge=0,
        description="End timestamp (seconds) in the video."
    )

    title: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Chapter title (max 6 words, never empty)."
    )

    description: Optional[str] = Field(
        default=None,
        description="1-2 sentence description of the chapter."
    )

    importance: Optional[str] = Field(
        default="Medium",
        description="Importance level: Low, Medium, High, Very High."
    )


class KeyMomentCreate(KeyMomentBase):
    """
    Schema for creating a key moment.
    """

    video_id: int

    confidence: Optional[float] = Field(
        default=0.0,
        ge=0,
        le=1,
    )


class KeyMomentUpdate(BaseModel):
    """
    Schema for updating a key moment.
    """

    start_time: Optional[float] = Field(
        default=None,
        ge=0,
    )

    end_time: float | None = Field(
        default=None,
        ge=0,
    )

    title: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    description: Optional[str] = None

    importance: Optional[str] = Field(
        default=None,
        description="Importance level: Low, Medium, High, Very High."
    )

    confidence: Optional[float] = Field(
        default=None,
        ge=0,
        le=1,
    )


class KeyMomentRead(KeyMomentBase):
    """
    Schema returned by the API.
    Relies on database-level NOT NULL or model-level defaults.
    """

    id: int

    video_id: int

    confidence: float

    title: str = Field(
        default="Key Discussion",
        max_length=255,
    )

    importance: str = Field(
        default="Medium",
        description="Importance level: Low, Medium, High, Very High."
    )

    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
