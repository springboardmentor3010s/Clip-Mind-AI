from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    DateTime
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database.database import Base


class Material(Base):
    __tablename__ = "materials"

    # ==========================================
    # Primary Key
    # ==========================================

    id = Column(Integer, primary_key=True, index=True)

    # ==========================================
    # Material Details
    # ==========================================

    title = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)

    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(100), nullable=False)

    # ==========================================
    # Foreign Keys
    # ==========================================

    video_id = Column(
        Integer,
        ForeignKey("videos.id", ondelete="CASCADE"),
        nullable=False
    )

    educator_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    # ==========================================
    # Relationships
    # ==========================================

    video = relationship(
        "Video",
        back_populates="materials"
    )

    educator = relationship(
        "User",
        back_populates="materials"
    )

    # ==========================================
    # Timestamp
    # ==========================================

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # ==========================================
    # Convert to Dictionary
    # ==========================================

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "file_name": self.file_name,
            "file_path": self.file_path,
            "file_type": self.file_type,
            "video_id": self.video_id,
            "educator_id": self.educator_id,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }