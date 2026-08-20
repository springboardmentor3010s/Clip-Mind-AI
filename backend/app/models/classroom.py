"""
Classroom model — a group an Educator creates and Students enroll into
(Google Classroom style). Backs the "classroom content analytics" and
"student engagement metrics" features in the PRD, which had no grouping
concept to scope against until now.
"""
import secrets
import string
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base

_INVITE_ALPHABET = string.ascii_uppercase + string.digits  # no lowercase: easier to read/type aloud


def generate_invite_code(length: int = 7) -> str:
    return "".join(secrets.choice(_INVITE_ALPHABET) for _ in range(length))


class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(150), nullable=False)
    educator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    invite_code = Column(String(12), unique=True, index=True, nullable=False, default=generate_invite_code)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def __repr__(self) -> str:
        return f"<Classroom id={self.id} name={self.name!r} educator_id={self.educator_id}>"