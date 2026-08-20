from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
)

from app.database.base import Base


class LearningHistory(Base):

    __tablename__ = "learning_history"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    learner_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    video_id = Column(
        Integer,
        ForeignKey("videos.id"),
        nullable=False,
        index=True
    )

    progress = Column(
        Float,
        default=0
    )

    current_time = Column(
        Float,
        default=0
    )

    completed = Column(
        Boolean,
        default=False
    )

    last_watched = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )