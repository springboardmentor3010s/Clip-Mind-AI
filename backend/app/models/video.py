from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    Text,
    JSON
)
from sqlalchemy.orm import relationship

from app.database import Base


class Video(Base):
    __tablename__ = "videos"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    filename = Column(
        String(255),
        nullable=False
    )

    original_filename = Column(
        String(255),
        nullable=False
    )

    file_path = Column(
        String(500),
        nullable=False
    )

    status = Column(
        String(50),
        default="Uploaded"
    )

    transcript = Column(
        Text,
        nullable=True
    )

    language = Column(
        String,
        nullable=True
    )

    summary = Column(
        Text,
        nullable=True
    )

    short_summary = Column(
        Text,
        nullable=True
    )

    timestamps = Column(
        JSON,
        nullable=True
    )

    key_moments = Column(
        JSON,
        nullable=True
    )

    keywords = Column(
        JSON,
        nullable=True
    )

    topics = Column(
        JSON,
        nullable=True
    )

    highlight_report = Column(
        JSON,
        nullable=True
    )

    # -----------------------------------------
    # OWNER
    # -----------------------------------------

    uploaded_by = Column(
        Integer,
        ForeignKey("users.id")
    )

    owner = relationship(
        "User",
        foreign_keys=[uploaded_by]
    )

    summary_shares = relationship(
    "SummaryShare",
    back_populates="video",
    cascade="all, delete-orphan"
    )

    # -----------------------------------------
    # CLASSROOM
    # -----------------------------------------

    classroom_id = Column(
        Integer,
        ForeignKey("classrooms.id"),
        nullable=True
    )

    classroom = relationship(
        "Classroom",
        back_populates="videos"
    )