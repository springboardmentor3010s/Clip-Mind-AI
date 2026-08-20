"""
Database models package.
Import all models here to ensure they are registered with SQLAlchemy Base.
"""
from app.models.role import Role
from app.models.user import User
from app.models.video import Video
from app.models.transcript import Transcript
from app.models.summary import Summary
from app.models.key_moment import KeyMoment
from app.models.analytics import Analytics
from app.models.bookmark import Bookmark
from app.models.processing_job import ProcessingJob
from app.models.activity_log import ActivityLog
from app.models.keyword import Keyword
from app.models.watch_history import WatchHistory
from app.models.bookmark_item import BookmarkItem
from app.models.summary_share import SummaryShare
from app.models.learning_material import LearningMaterial
from app.models.learning_material_share import LearningMaterialShare
from app.models.platform_setting import PlatformSetting


__all__ = [
    "Role",
    "User",
    "Video",
    "Transcript",
    "Summary",
    "KeyMoment",
    "Analytics",
    "Bookmark",
    "ProcessingJob",
    "ActivityLog",
    "Keyword",
    "WatchHistory",
    "BookmarkItem",
    "SummaryShare",
    "LearningMaterial",
    "LearningMaterialShare",
    "PlatformSetting",
]
