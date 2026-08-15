from sqlalchemy.orm import Session

from app.models.key_moment import KeyMoment


def create_key_moment(
    db: Session,
    video_id: int,
    transcript_segment_id: int,
    start_time: float,
    end_time: float,
    title: str,
    segment_text: str,
    importance_score: float
):
    key_moment = KeyMoment(
        video_id=video_id,
        transcript_segment_id=transcript_segment_id,
        start_time=start_time,
        end_time=end_time,
        title=title,
        segment_text=segment_text,
        importance_score=importance_score
    )

    db.add(key_moment)
    db.commit()
    db.refresh(key_moment)

    return key_moment


def get_key_moments_by_video(
    db: Session,
    video_id: int
):
    return (
        db.query(KeyMoment)
        .filter(
            KeyMoment.video_id == video_id
        )
        .order_by(
            KeyMoment.start_time
        )
        .all()
    )


def delete_key_moments_by_video(
    db: Session,
    video_id: int
):
    (
        db.query(KeyMoment)
        .filter(
            KeyMoment.video_id == video_id
        )
        .delete(
            synchronize_session=False
        )
    )

    db.commit()