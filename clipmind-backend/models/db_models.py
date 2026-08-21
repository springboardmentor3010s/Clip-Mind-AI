import json

from sqlalchemy import Column, String, Float, Text, ForeignKey
from models.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="Content Creator")
    institution = Column(String, nullable=True)
    created_at = Column(String, nullable=False)

    def to_record(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "institution": self.institution,
        }


class Video(Base):
    """
    Stores one uploaded recording plus all pipeline outputs.

    user_id associates the recording with the authenticated user who
    uploaded it. Existing rows may temporarily contain NULL until the
    one-time migration is performed.
    """
    __tablename__ = "videos"

    id = Column(String, primary_key=True, index=True)

    user_id = Column(
        String,
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    title = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    audio_path = Column(String, nullable=True)
    size_mb = Column(Float, nullable=False)
    duration_seconds = Column(Float, nullable=False, default=0)
    status = Column(
        String,
        nullable=False,
        default="Queued",
    )
    created_at = Column(String, nullable=False)
    language = Column(String, nullable=False, default="Unknown")

    transcript_json = Column(
        Text,
        nullable=False,
        default="[]",
    )
    summary_json = Column(Text, nullable=True)
    moments_json = Column(
        Text,
        nullable=False,
        default="[]",
    )
    analytics_json = Column(Text, nullable=True)

    error = Column(Text, nullable=True)

    def to_record(self) -> dict:
        """Serialize to the exact VideoRecord shape the frontend expects."""
        from services.time_utils import fmt

        return {
            "id": self.id,
            "title": self.title,
            "fileName": self.file_name,
            "sizeMb": round(self.size_mb, 1),
            "durationSeconds": round(self.duration_seconds),
            "duration": fmt(self.duration_seconds),
            "status": self.status,
            "createdAt": self.created_at,
            "language": self.language,
            "transcript": json.loads(
                self.transcript_json or "[]"
            ),
            "summary": (
                json.loads(self.summary_json)
                if self.summary_json
                else None
            ),
            "moments": json.loads(
                self.moments_json or "[]"
            ),
            "analytics": (
                json.loads(self.analytics_json)
                if self.analytics_json
                else None
            ),
        }


class ActivityLog(Base):
    """
    Audit trail of meaningful user actions (registration, login, video
    upload/deletion, transcript/summary/moments/analytics generation,
    profile updates). Scoped per-user for retrieval; Administrators may
    see all activity, matching the RBAC pattern used for analytics.
    """
    __tablename__ = "activity_logs"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    action = Column(String, nullable=False)
    video_id = Column(String, ForeignKey("videos.id"), nullable=True, index=True)
    details = Column(Text, nullable=True)
    created_at = Column(String, nullable=False, index=True)

    def to_record(self) -> dict:
        return {
            "id": self.id,
            "action": self.action,
            "videoId": self.video_id,
            "details": self.details,
            "createdAt": self.created_at,
        }