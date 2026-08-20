from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

# Import all models

from app.models.user import User
from app.models.video import Video
from app.models.course import Course
from app.models.transcript import Transcript
from app.models.shared_lecture import SharedLecture
from app.models.classroom import Classroom
from app.models.classroom_post import ClassroomPost
from app.models.classroom_member import ClassroomMember
from app.models.learning_history import LearningHistory
from app.models.bookmark import Bookmark
from app.models.audit_log import AuditLog
from app.models.platform_setting import PlatformSetting