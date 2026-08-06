from sqlalchemy import Column, Integer, ForeignKey, DateTime
from datetime import datetime

from app.database.base import Base


class SharedLecture(Base):

    __tablename__ = "shared_lectures"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    video_id = Column(
        Integer,
        ForeignKey("videos.id")
    )

    educator_id = Column(
        Integer,
        ForeignKey("users.id")
    )

    shared_at = Column(
        DateTime,
        default=datetime.utcnow
    )