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

    video = Video(
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


# ---------------------------------------------------------
# Get videos uploaded by a specific user
# Used for Content Creator / Educator management
# ---------------------------------------------------------
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


# ---------------------------------------------------------
# Get all completed videos
# Used for Learners to browse available content
# ---------------------------------------------------------
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


# ---------------------------------------------------------
# Get a video owned by a specific user
# Used for management/generation operations
# ---------------------------------------------------------
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


# ---------------------------------------------------------
# Get any available video by ID
# Used when users are consuming/viewing content
# ---------------------------------------------------------
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