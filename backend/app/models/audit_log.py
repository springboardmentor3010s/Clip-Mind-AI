from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base
from app.core.types import GUID


class AuditLog(Base):
    """Administrator-visible record of sensitive platform actions — 'Monitor
    platform activity and audit logs' from the Administrator feature set."""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_user_id = Column(GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String, nullable=False)  # e.g. "role_changed", "video_deleted"
    target_type = Column(String, nullable=True)  # e.g. "user", "video"
    target_id = Column(String, nullable=True)
    detail = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    actor = relationship("User")
