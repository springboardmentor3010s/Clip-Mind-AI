from datetime import datetime

from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Text
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey

from app.database.base import Base
from sqlalchemy.orm import relationship
from sqlalchemy import Boolean
from sqlalchemy.sql import func
class Course(Base):

    __tablename__ = "courses"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    title = Column(
        String(255),
        nullable=False
    )

    description = Column(
        Text
    )

    category = Column(
        String(100),
        nullable=True
    )

    difficulty = Column(
        String(50),
        nullable=True
    )

    thumbnail = Column(
        String(500),
        nullable=True
    )

    educator_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )
    
    videos = relationship(
        "Video",
        back_populates="course",
        cascade="all, delete"
    )
    
    is_published = Column(Boolean, default=False)

    published_at = Column(DateTime, nullable=True)