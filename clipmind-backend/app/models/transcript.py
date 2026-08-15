from sqlalchemy import (
    Column,
    Integer,
    Text,
    String,
    ForeignKey,
    DateTime
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(Integer, primary_key=True, index=True)

    video_id = Column(
        Integer,
        ForeignKey("videos.id"),
        nullable=False
    )

    language = Column(
        String,
        nullable=False,
        default="en"
    )

    transcript_text = Column(
        Text,
        nullable=False
    )

    transcript_file_path = Column(
        String,
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    video = relationship(
        "Video",
        back_populates="transcript"
    )

    segments = relationship(
    "TranscriptSegment",
    back_populates="transcript",
    cascade="all, delete-orphan"
)