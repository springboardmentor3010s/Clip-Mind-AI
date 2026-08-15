from sqlalchemy import (
    Column,
    Integer,
    Float,
    Text,
    DateTime,
    ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class KeyMoment(Base):
    __tablename__ = "key_moments"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    video_id = Column(
        Integer,
        ForeignKey("videos.id"),
        nullable=False
    )

    transcript_segment_id = Column(
        Integer,
        ForeignKey("transcript_segments.id"),
        nullable=False
    )

    start_time = Column(
        Float,
        nullable=False
    )

    end_time = Column(
        Float,
        nullable=False
    )

    title = Column(
        Text,
        nullable=False
    )

    segment_text = Column(
        Text,
        nullable=False
    )

    importance_score = Column(
        Float,
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    video = relationship(
        "Video",
        back_populates="key_moments"
    )

    transcript_segment = relationship(
        "TranscriptSegment"
    )