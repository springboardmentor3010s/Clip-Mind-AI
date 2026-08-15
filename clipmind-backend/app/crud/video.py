from sqlalchemy.orm import joinedload
from sqlalchemy.orm import Session

from app.models.video import Video
from app.core.enums import VideoStatus


def create_video(
    db: Session,
    filename: str,
    filepath: str,
    audio_path: str,
    thumbnail_path: str,
    duration: float,
    file_size: int,
    owner_id: int
):

    video = Video (
        filename=filename,
        filepath=filepath,
        audio_path=audio_path,
        thumbnail_path=thumbnail_path,
        duration=duration,
        file_size=file_size,
        status=VideoStatus.COMPLETED.value,
        owner_id=owner_id
    )

    db.add(video)
    db.commit()
    db.refresh(video)

    return video


def get_user_videos(
    db: Session,
    owner_id: int
):

    return (
    db.query(Video)
    .options(
        joinedload(Video.transcript),
        joinedload(Video.summaries)
    )
    .filter(Video.owner_id == owner_id)
    .all()
)


def get_video_by_id(
    db: Session,
    video_id: int,
    owner_id: int
):

    return (
        db.query(Video)
        .filter(
            Video.id == video_id,
            Video.owner_id == owner_id
        )
        .first()
    )