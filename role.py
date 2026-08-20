"""
Role model.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, func
from sqlalchemy.orm import relationship

from app.database.database import Base

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)

    # Relationship
    users = relationship("User", back_populates="role_rel", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Role(id={self.id}, name='{self.name}')>"
