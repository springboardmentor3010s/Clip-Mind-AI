from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
)


from app.database.base import Base


class AuditLog(Base):

    __tablename__ = "audit_logs"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        nullable=True,
        index=True
    )

    username = Column(
        String(100),
        nullable=True
    )

    action = Column(
        String(100),
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
    )

    entity_type = Column(
        String(50),
        nullable=True
    )

    entity_id = Column(
        Integer,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        index=True
    )