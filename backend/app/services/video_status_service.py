from app.models.video import Video


def update_status(
    db,
    video_id,
    status,
    stage,
    progress
):

    video = (
        db.query(Video)
        .filter(Video.id == video_id)
        .first()
    )

    if not video:
        return

    video.status = status
    video.processing_stage = stage
    video.progress = progress

    db.commit()