from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import ForeignKey
from sqlalchemy import Text

from app.database.base import Base


class Transcript(Base):

    __tablename__ = "transcripts"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    video_id = Column(
        Integer,
        ForeignKey(
        "videos.id",
        ondelete="CASCADE"
        ),
    nullable=False
    )

    transcript_text = Column(
        Text,
        nullable=False
    )

    transcript_json = Column(
        Text,
        nullable=False
    )