from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    ForeignKey,
    DateTime
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class Summary(Base):
    __tablename__ = "summaries"

    id = Column(Integer, primary_key=True, index=True)

    video_id = Column(
        Integer,
        ForeignKey("videos.id"),
        nullable=False
    )

    summary_type = Column(
        String,
        nullable=False
    )  # short / detailed

    summary_text = Column(
        Text,
        nullable=False
    )

    model_name = Column(
        String,
        nullable=False
    )

    processing_time = Column(
    String,
    nullable=True
)


    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    video = relationship(
        "Video",
        back_populates="summaries"
    )