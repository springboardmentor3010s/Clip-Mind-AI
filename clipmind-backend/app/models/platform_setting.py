from sqlalchemy import Column, Integer, Boolean, Float, DateTime
from sqlalchemy.sql import func

from app.database.base import Base


class PlatformSetting(Base):
    __tablename__ = "platform_settings"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    maintenance_mode = Column(
        Boolean,
        default=False,
        nullable=False
    )

    ai_processing_enabled = Column(
        Boolean,
        default=True,
        nullable=False
    )

    max_upload_size_mb = Column(
        Float,
        default=500.0,
        nullable=False
    )

    allow_public_registration = Column(
        Boolean,
        default=True,
        nullable=False
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )