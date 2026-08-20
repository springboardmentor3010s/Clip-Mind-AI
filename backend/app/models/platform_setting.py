from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
)

from app.database.base import Base


class PlatformSetting(Base):

    __tablename__ = "platform_settings"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    setting_key = Column(
        String(100),
        unique=True,
        nullable=False,
        index=True
    )

    setting_value = Column(
        Text,
        nullable=True
    )

    description = Column(
        Text,
        nullable=True
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )