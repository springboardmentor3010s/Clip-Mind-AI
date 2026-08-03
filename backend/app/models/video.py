from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)

    filename = Column(String(255), nullable=False)

    original_filename = Column(String(255), nullable=False)

    file_path = Column(String(500), nullable=False)

    status = Column(String(50), default="Uploaded")
    transcript = Column(Text, nullable=True)

    summary = Column(Text, nullable=True)

    uploaded_by = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User")