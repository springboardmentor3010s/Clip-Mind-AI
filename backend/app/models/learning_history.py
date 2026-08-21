from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.database import Base


class LearningHistory(Base):
    __tablename__ = "learning_history"

    # ==========================================
    # Primary Key
    # ==========================================
    id = Column(Integer, primary_key=True, index=True)

    # ==========================================
    # Foreign Keys
    # ==========================================
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    video_id = Column(
        Integer,
        ForeignKey("videos.id"),
        nullable=False
    )

    # ==========================================
    # Watch Information
    # ==========================================
    watched_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    progress = Column(
        Integer,
        default=0
    )

    # ==========================================
    # Relationships
    # ==========================================
    user = relationship(
        "User",
        back_populates="learning_history"
    )

    video = relationship(
        "Video"
    )

    # ==========================================
    # Response
    # ==========================================
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "video_id": self.video_id,
            "progress": self.progress,
            "watched_at": self.watched_at.isoformat() if self.watched_at else None
        }