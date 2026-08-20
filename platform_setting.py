"""
PlatformSetting model: key/value configuration for platform-wide settings.
These are managed by administrators and applied across the application.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, func

from app.database.database import Base

class PlatformSetting(Base):
    __tablename__ = "platform_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), nullable=False, unique=True, index=True)
    value = Column(Text, nullable=True)
    value_type = Column(String(20), default="string", nullable=False)
    description = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<PlatformSetting(key='{self.key}', value='{self.value}')>"