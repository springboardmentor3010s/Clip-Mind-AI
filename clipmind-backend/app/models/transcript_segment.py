from sqlalchemy import (
    Column,
    Integer,
    Float,
    Text,
    Boolean,
    ForeignKey,
    DateTime
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"

    id = Column(Integer, primary_key=True, index=True)

    transcript_id = Column(
        Integer,
        ForeignKey("transcripts.id"),
        nullable=False
    )

    video_id = Column(
        Integer,
        ForeignKey("videos.id"),
        nullable=False
    )

    segment_index = Column(
        Integer,
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

    segment_text = Column(
        Text,
        nullable=False
    )

    is_edited = Column(
        Boolean,
        default=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    transcript = relationship(
        "Transcript",
        back_populates="segments"
    )

    video = relationship(
        "Video",
        back_populates="transcript_segments"
    )
