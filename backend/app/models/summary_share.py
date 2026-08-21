from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class SummaryShare(Base):
    __tablename__ = "summary_shares"

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

    classroom_id = Column(
        Integer,
        ForeignKey("classrooms.id"),
        nullable=False
    )

    video = relationship(
        "Video",
        back_populates="summary_shares"
    )

    classroom = relationship(
        "Classroom",
        back_populates= "summary_shares"
    )

    __table_args__ = (
        UniqueConstraint(
            "video_id",
            "classroom_id",
            name="unique_video_classroom_summary"
        ),
    )