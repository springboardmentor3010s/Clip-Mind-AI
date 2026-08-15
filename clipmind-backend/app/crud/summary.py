from sqlalchemy.orm import Session

from app.models.summary import Summary
from app.models.video import Video


def create_summary(
    db: Session,
    video: Video,
    summary_type: str,
    summary_text: str,
    model_name: str,
    processing_time: str = None
):

    summary = Summary(
        video_id=video.id,
        summary_type=summary_type,
        summary_text=summary_text,
        model_name=model_name,
        processing_time=processing_time
    )

    db.add(summary)
    db.commit()
    db.refresh(summary)

    return summary


def get_summary_by_video(
    db: Session,
    video: Video
):

    return (
        db.query(Summary)
        .filter(
            Summary.video_id == video.id
        )
        .all()
    )


def get_summary_by_type(
    db: Session,
    video: Video,
    summary_type: str
):

    return (
        db.query(Summary)
        .filter(
            Summary.video_id == video.id,
            Summary.summary_type == summary_type
        )
        .first()
    )