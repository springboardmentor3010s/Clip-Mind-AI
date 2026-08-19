from sqlalchemy import Column, String
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base
from app.core.types import GUID


class Role(Base):
    __tablename__ = "roles"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String, nullable=True)

    users = relationship("User", back_populates="role")