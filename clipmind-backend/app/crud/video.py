import os

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
    classroom_id: int | None = None
):
    video = Video(
        filename=filename,
        filepath=filepath,
        audio_path=audio_path,
        thumbnail_path=thumbnail_path,
        duration=duration,
        file_size=file_size,
        status=VideoStatus.PROCESSING.value,
        owner_id=owner_id,
        classroom_id=classroom_id
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

def get_all_videos_for_admin(
    db: Session
):
    return (
        db.query(Video)
        .options(
            joinedload(Video.owner),
            joinedload(Video.classroom),
            joinedload(Video.transcript),
            joinedload(Video.summaries)
        )
        .order_by(
            Video.created_at.desc()
        )
        .all()
    )

def delete_video(
    db: Session,
    video: Video
):
    """
    Delete a video and its associated database records/files.
    """

    # --------------------------------------------------------
    # Save physical file paths before deleting the DB record
    # --------------------------------------------------------

    file_paths = [
        video.filepath,
        video.audio_path,
        video.thumbnail_path
    ]

    # --------------------------------------------------------
    # Delete summaries
    # --------------------------------------------------------

    for summary in list(video.summaries):
        db.delete(summary)

    # --------------------------------------------------------
    # Delete transcript segments
    # --------------------------------------------------------

    for segment in list(video.transcript_segments):
        db.delete(segment)

    # --------------------------------------------------------
    # Delete transcript
    # --------------------------------------------------------

    if video.transcript:
        db.delete(video.transcript)

    # --------------------------------------------------------
    # Delete key moments
    # --------------------------------------------------------

    for key_moment in list(video.key_moments):
        db.delete(key_moment)

    # --------------------------------------------------------
    # Delete keywords
    # --------------------------------------------------------

    for keyword in list(video.keywords):
        db.delete(keyword)

    # --------------------------------------------------------
    # Delete video
    # --------------------------------------------------------

    db.delete(video)

    db.commit()

    # --------------------------------------------------------
    # Delete physical files
    # --------------------------------------------------------

    for file_path in file_paths:

        if file_path and os.path.exists(file_path):

            try:
                os.remove(file_path)

            except OSError as error:
                print(
                    f"Could not delete file "
                    f"{file_path}: {error}"
                )

    return True