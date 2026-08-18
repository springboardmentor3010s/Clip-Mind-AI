from sqlalchemy.orm import joinedload
from sqlalchemy.orm import Session

from app.models.video import Video
from app.core.enums import VideoStatus


def create_video(
    db: Session,
    filename: str,
    filepath: str,
    audio_path: str = None,
    thumbnail_path: str = None,
    duration: float = None,
    file_size: int = None,
    owner_id: int = None,
):
    video = Video(
        filename=filename,
        filepath=filepath,
        audio_path=audio_path,
        thumbnail_path=thumbnail_path,
        duration=duration,
        file_size=file_size,
        status=VideoStatus.PROCESSING.value,
        owner_id=owner_id
    )

    db.add(video)
    db.commit()
    db.refresh(video)

    return video


def update_video_status(
    db: Session,
    video: Video,
    status: str
):
    video.status = status

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
        .order_by(Video.created_at.desc())
        .all()
    )


def get_all_available_videos(
    db: Session
):
    return (
        db.query(Video)
        .options(
            joinedload(Video.transcript),
            joinedload(Video.summaries)
        )
        .filter(
            Video.status == VideoStatus.COMPLETED.value
        )
        .order_by(Video.created_at.desc())
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


def get_available_video_by_id(
    db: Session,
    video_id: int
):
    return (
        db.query(Video)
        .filter(
            Video.id == video_id,
            Video.status == VideoStatus.COMPLETED.value
        )
        .first()
    )