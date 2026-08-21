import json

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    Text,
    JSON
)

from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database.database import Base


class Video(Base):
    __tablename__ = "videos"

    # ==========================================
    # Primary Key
    # ==========================================

    id = Column(Integer, primary_key=True, index=True)

    # ==========================================
    # Upload Information
    # ==========================================

    title = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    content_type = Column(String(100), nullable=False)

    # ==========================================
    # Video Metadata
    # ==========================================

    duration = Column(Float, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    codec = Column(String(50), nullable=True)

    # ==========================================
    # Generated Files
    # ==========================================

    thumbnail_path = Column(String(500), nullable=True)
    compressed_path = Column(String(500), nullable=True)

    # ==========================================
    # AI Processing
    # ==========================================

    transcript = Column(Text, nullable=True)

    summary = Column(Text, nullable=True)

    key_moments = Column(JSON, nullable=True)

    # NEW
    keywords = Column(JSON, nullable=True)

    # ==========================================
    # Processing Status
    # ==========================================

    status = Column(
        String(50),
        nullable=False,
        default="Uploaded"
    )

    # ==========================================
    # User Relationship
    # ==========================================

    uploaded_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    user = relationship(
        "User",
        back_populates="videos"
    )

    # ==========================================
    # Timestamps
    # ==========================================

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    # ==========================================
    # Convert Object to Dictionary
    # ==========================================

    def to_dict(self):

        key_moments = self.key_moments
        keywords = self.keywords

        if isinstance(key_moments, str):
            try:
                key_moments = json.loads(key_moments)
            except Exception:
                key_moments = []

        if isinstance(keywords, str):
            try:
                keywords = json.loads(keywords)
            except Exception:
                keywords = []

        return {
            "id": self.id,
            "title": self.title,
            "filename": self.filename,
            "file_path": self.file_path,
            "file_size": self.file_size,
            "content_type": self.content_type,

            "duration": self.duration,
            "width": self.width,
            "height": self.height,
            "codec": self.codec,

            "thumbnail_path": self.thumbnail_path,
            "compressed_path": self.compressed_path,

            "transcript": self.transcript,
            "summary": self.summary,
            "key_moments": key_moments,
            "keywords": keywords,

            "status": self.status,
            "uploaded_by": self.uploaded_by,

            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

    # ==========================================
    # Dashboard Response
    # ==========================================

    def to_summary(self):
        return {
            "id": self.id,
            "title": self.title,
            "thumbnail_path": self.thumbnail_path,
            "duration": self.duration,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

    # ==========================================
    # Transcript Response
    # ==========================================

    def transcript_dict(self):
        return {
            "video_id": self.id,
            "title": self.title,
            "transcript": self.transcript,
            "status": self.status
        }

    # ==========================================
    # Summary Response
    # ==========================================

    def summary_dict(self):
        return {
            "video_id": self.id,
            "title": self.title,
            "summary": self.summary,
            "status": self.status
        }

    # ==========================================
    # Key Moments Response
    # ==========================================

    def key_moments_dict(self):

        key_moments = self.key_moments

        if isinstance(key_moments, str):
            try:
                key_moments = json.loads(key_moments)
            except Exception:
                key_moments = []

        return {
            "video_id": self.id,
            "title": self.title,
            "key_moments": key_moments,
            "status": self.status
        }

    # ==========================================
    # Keywords Response
    # ==========================================

    def keywords_dict(self):

        keywords = self.keywords

        if isinstance(keywords, str):
            try:
                keywords = json.loads(keywords)
            except Exception:
                keywords = []

        return {
            "video_id": self.id,
            "title": self.title,
            "keywords": keywords,
            "status": self.status
        }
