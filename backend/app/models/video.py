from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    DateTime,
    ForeignKey,
)

from app.database.base import Base
from sqlalchemy.orm import relationship

class Video(Base):

    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(255), nullable=False)

    description = Column(Text)

    category = Column(String(100))

    original_filename = Column(String(255), nullable=False)

    filename = Column(String(255), nullable=False)

    file_size = Column(Integer)

    file_type = Column(String(100))

    duration = Column(String(50), nullable=True)

    thumbnail = Column(String(255), nullable=True)

    transcript_path = Column(String(255), nullable=True)

    summary = Column(Text, nullable=True)
    
    topics = Column(Text)

    key_moments = Column(Text)

    quiz = Column(Text)

    flashcards = Column(Text)

    status = Column(
        String(50),
        default="Uploaded"
    )

    uploaded_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id")
    )

    course_id = Column(
        Integer,
        ForeignKey("courses.id"),
        nullable=True
    )
    
    course = relationship(
        "Course",
        back_populates="videos"
    )

    processing_started = Column(
        DateTime,
        nullable=True
    )

    processing_completed = Column(
        DateTime,
        nullable=True
    )

    processing_stage = Column(
        String(255),
        default="Waiting"
    )

    progress = Column(
        Float,
        default=0
    )

    error_message = Column(
        Text,
        nullable=True
    )
    
    views = Column(
    Integer,
    default=0
    )