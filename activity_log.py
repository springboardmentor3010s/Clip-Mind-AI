"""
ActivityLog model.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship

from app.database.database import Base

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50), nullable=True)
    resource_id = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)

    # Relationship
    user = relationship("User", back_populates="activity_logs")

    def __repr__(self):
        return f"<ActivityLog(id={self.id}, user_id={self.user_id}, action='{self.action}')>"
