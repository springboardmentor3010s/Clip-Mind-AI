from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database.base import Base


class SummaryShare(Base):
    __tablename__ = "summary_shares"

    id = Column(Integer, primary_key=True, index=True)

    summary_id = Column(
        Integer,
        ForeignKey("summaries.id"),
        nullable=False
    )

    classroom_id = Column(
        Integer,
        ForeignKey("classrooms.id"),
        nullable=False
    )

    shared_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    shared_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )