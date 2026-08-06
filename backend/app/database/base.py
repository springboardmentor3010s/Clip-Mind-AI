from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

# Import all models

from app.models.user import User
from app.models.video import Video
from app.models.course import Course
from app.models.transcript import Transcript
from app.models.shared_lecture import SharedLecture