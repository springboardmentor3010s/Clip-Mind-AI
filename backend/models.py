from sqlalchemy import Column, Integer, String, Float, Text, Boolean, ForeignKey
from database import Base


# ===========================
# User Table
# ===========================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    
    # Roles: "Learner", "Content Creator", "Educator", "Admin"
    role = Column(String, default="Learner", nullable=False)


# ===========================
# Video Table
# ===========================

class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id")
    )

    video_name = Column(
        String,
        nullable=False
    )

    file_path = Column(
        String,
        nullable=False
    )

    # --------------------------
    # Upload Information
    # --------------------------

    language = Column(
        String,
        default="English"
    )

    duration = Column(
        Float,
        default=0
    )

    file_size = Column(
        Float,
        default=0
    )

    # --------------------------
    # Transcript Analytics
    # --------------------------

    transcript_length = Column(
        Integer,
        default=0
    )

    word_count = Column(
        Integer,
        default=0
    )

    processing_time = Column(
        Float,
        default=0
    )

    # --------------------------
    # Summary Analytics
    # --------------------------

    summary_length = Column(
        Integer,
        default=0
    )

    # --------------------------
    # Key Moments Analytics
    # --------------------------

    keyword_count = Column(
        Integer,
        default=0
    )

    segment_count = Column(
        Integer,
        default=0
    )

    highlight_score = Column(
        Float,
        default=0
    )

    # =========================================================
    # 🟢 NEWLY ADDED COLUMNS FOR EDUCATOR REQUIREMENTS
    # =========================================================

    # Requirement 3: Editable Transcript Storage
    transcript = Column(
        Text,
        nullable=True
    )

    # Requirement 2 & 4: Generated & Shared Summary Storage
    short_summary = Column(
        Text,
        nullable=True
    )

    detailed_summary = Column(
        Text,
        nullable=True
    )

    is_shared = Column(
        Boolean,
        default=False
    )

    # Requirement 5: AI Created Learning Material
    learning_material = Column(
        Text,
        nullable=True
    )

    # Requirement 6 & 7: Classroom & Student Engagement Metrics
    views_count = Column(
        Integer,
        default=0
    )

    summary_views = Column(
        Integer,
        default=0
    )

    transcript_views = Column(
        Integer,
        default=0
    )

    keymoment_views = Column(
        Integer,
        default=0
    )