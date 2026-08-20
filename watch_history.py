"""
WatchHistory model.

Tracks per-user learning history: which videos a user has watched,
how long they watched, and their progress (for a "Continue Watching"
/ learning history experience).
"""
from sqlalchemy import (
    Column,
    Integer,
    Float,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship

from app.database.database import Base

class WatchHistory(Base):
    __tablename__ = "watch_history"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    video_id = Column(
        Integer,
        ForeignKey("videos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Seconds of video watched (updates as the learner watches).
    watch_duration = Column(Float, default=0.0, nullable=False)

    # 0.0 - 1.0 fraction of the video completed.
    completion_rate = Column(Float, default=0.0, nullable=False)

    last_watched_at = Column(
        DateTime(timezone=True),
        default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id", "video_id",
            name="uq_watch_history_user_video",
        ),
    )

    user = relationship("User", back_populates="watch_history")
    video = relationship("Video", back_populates="watch_history")

    def __repr__(self):
        return (
            f"<WatchHistory(id={self.id}, "
            f"user_id={self.user_id}, video_id={self.video_id}, "
            f"completion={self.completion_rate:.0%})>"
        )