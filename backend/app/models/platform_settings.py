from sqlalchemy import Column, Integer, Boolean, DateTime
from datetime import datetime

from app.core.database import Base


class PlatformSettings(Base):
    """Singleton row (id always 1) of site-wide configuration an
    Administrator can change — 'Configure platform settings'. Actually
    enforced at the relevant endpoints, not just displayed."""
    __tablename__ = "platform_settings"

    id = Column(Integer, primary_key=True, default=1)
    maintenance_mode = Column(Boolean, default=False)
    allow_new_registrations = Column(Boolean, default=True)
    max_upload_size_mb = Column(Integer, default=2048)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
