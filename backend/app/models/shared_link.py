from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base
from app.core.types import GUID


class SharedLink(Base):
    """A read-only public link an Educator (or Creator/Admin) can hand to
    students — 'Share summaries with students' from the Educator feature set."""
    __tablename__ = "shared_links"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    video = relationship("Video")
    creator = relationship("User")
