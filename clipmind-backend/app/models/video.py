from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    Float,
    BigInteger,
    DateTime
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)

    filename = Column(String, nullable=False)

    filepath = Column(String, nullable=False)

    audio_path = Column(String, nullable=True)

    thumbnail_path = Column(String, nullable=True)

    duration = Column(Float, nullable=True)

    file_size = Column(BigInteger, nullable=True)

    status = Column(String, default="uploaded")

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    owner_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    classroom_id = Column(
    Integer,
    ForeignKey(
        "classrooms.id",
        ondelete="SET NULL"
    ),
    nullable=True,
    index=True
)

    owner = relationship(
        "User",
        back_populates="videos"
    )

    classroom = relationship(
    "Classroom",
    back_populates="videos"
)

    transcript = relationship(
    "Transcript",
    back_populates="video",
    uselist=False
)

    summaries = relationship(
      "Summary",
       back_populates="video"
)

    transcript_segments = relationship(
    "TranscriptSegment",
    back_populates="video",
    cascade="all, delete-orphan"
)

    key_moments = relationship(
    "KeyMoment",
    back_populates="video",
    cascade="all, delete-orphan"
)

    keywords = relationship(
    "Keyword",
    back_populates="video",
    cascade="all, delete-orphan"
)