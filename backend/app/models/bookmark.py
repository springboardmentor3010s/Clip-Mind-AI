from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base
from app.core.types import GUID


class Bookmark(Base):
    """A learner's saved reference to a video, its summary, or a specific key
    moment — 'Bookmark summaries and highlights' from the Learner feature set."""
    __tablename__ = "bookmarks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    video_id = Column(Integer, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)

    # "video" | "summary" | "key_moment" — what kind of thing was bookmarked.
    target_type = Column(String, nullable=False, default="video")
    # For target_type == "key_moment", the KeyMoment.id being referenced.
    target_id = Column(Integer, nullable=True)

    note = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    video = relationship("Video")
