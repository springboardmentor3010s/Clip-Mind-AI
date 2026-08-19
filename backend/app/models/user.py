from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.core.database import Base
from app.core.types import GUID


class User(Base):
    __tablename__ = "users"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)

    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String, nullable=False)

    role_id = Column(GUID(), ForeignKey("roles.id"), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    # relationship (optional but IMPORTANT later)
    role = relationship("Role", back_populates="users")