"""
AuditLog model — records who did what, when, for the Admin module's
"access audit logs and reports" feature. Append-only; nothing ever
updates or deletes a row here except normal data retention policy.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    action = Column(String(100), nullable=False, index=True)  # e.g. "user.login", "video.deleted"
    target_type = Column(String(50), nullable=True)  # e.g. "user", "video"
    target_id = Column(UUID(as_uuid=True), nullable=True)
    detail = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

    def __repr__(self) -> str:
        return f"<AuditLog actor_id={self.actor_id} action={self.action}>"