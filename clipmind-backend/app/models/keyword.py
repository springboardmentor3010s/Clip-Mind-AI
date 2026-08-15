from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    ForeignKey,
    DateTime
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class Keyword(Base):
    __tablename__ = "keywords"

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

    keyword = Column(
        String,
        nullable=False
    )

    frequency = Column(
        Integer,
        nullable=False,
        default=1
    )

    relevance_score = Column(
        Float,
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    video = relationship(
        "Video",
        back_populates="keywords"
    )