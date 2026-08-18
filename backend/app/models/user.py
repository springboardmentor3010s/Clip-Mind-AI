from enum import Enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON
from pydantic import BaseModel, EmailStr, ConfigDict
from app.core.database import Base

# ==========================================
# 1. Role Enum Definition
# ==========================================
class UserRole(str, Enum):
    LEARNER = "Learner"
    CREATOR = "Content Creator"
    EDUCATOR = "Educator"
    ADMIN = "Administrator"

# ==========================================
# 2. SQLAlchemy Core Models
# ==========================================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default=UserRole.LEARNER.value)
    is_active = Column(Boolean, default=True)

class LearnerBookmark(Base):
    __tablename__ = "learner_bookmarks"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True, nullable=False)
    video_id = Column(Integer, index=True, nullable=False)
    item_type = Column(String, default="highlight")
    title = Column(String, nullable=True)
    content = Column(Text, nullable=False)
    timestamp_str = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class LearnerHistory(Base):
    __tablename__ = "learner_history"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True, nullable=False)
    video_id = Column(Integer, index=True, nullable=False)
    video_filename = Column(String, nullable=True)
    last_accessed = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class EducatorMaterial(Base):
    __tablename__ = "educator_materials"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, index=True, nullable=False)
    title = Column(String, nullable=False)
    study_notes = Column(Text, nullable=False)
    quiz_questions = Column(JSON, nullable=True)
    share_token = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class SystemAuditLog(Base):
    __tablename__ = "system_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, default="system")
    event_type = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    level = Column(String, default="INFO")
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class SystemConfig(Base):
    __tablename__ = "system_configs"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False)
    value = Column(String, nullable=False)
    description = Column(String, nullable=True)

# ==========================================
# 3. Pydantic Schemas
# ==========================================
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    role: str = "Learner"

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: str
    is_active: bool = True

    model_config = ConfigDict(from_attributes=True)