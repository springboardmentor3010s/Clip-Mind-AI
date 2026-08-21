from sqlalchemy.orm import Session

from app.models.video import Video
from app.models.shared_video import SharedVideo
from app.models.user import User


def classroom_analytics(db: Session, educator_id: int):

    # =====================================================
    # Videos Uploaded by Educator
    # =====================================================

    videos = (
        db.query(Video)
        .filter(Video.uploaded_by == educator_id)
        .all()
    )

    total_videos = len(videos)

    processed_videos = sum(
        1 for video in videos
        if video.status == "Processed"
    )

    uploaded_videos = sum(
        1 for video in videos
        if video.status == "Uploaded"
    )

    total_duration = sum(
        video.duration or 0
        for video in videos
    )

    average_duration = (
        round(total_duration / total_videos, 2)
        if total_videos > 0 else 0
    )

    transcripts_generated = sum(
        1 for video in videos
        if video.transcript
    )

    summaries_generated = sum(
        1 for video in videos
        if video.summary
    )

    # =====================================================
    # Shared Videos
    # =====================================================

    shared_records = (
        db.query(SharedVideo)
        .filter(SharedVideo.educator_id == educator_id)
        .all()
    )

    total_shared_videos = len(shared_records)

    # =====================================================
    # Learner Details
    # =====================================================

    learner_map = {}

    for record in shared_records:

        learner = (
            db.query(User)
            .filter(User.id == record.learner_id)
            .first()
        )

        video = (
            db.query(Video)
            .filter(Video.id == record.video_id)
            .first()
        )

        if learner is None:
            continue

        if learner.id not in learner_map:

            learner_map[learner.id] = {
                "learner_id": learner.id,
                "learner_name": learner.full_name,
                "shared_videos": 0,
                "videos": []
            }

        learner_map[learner.id]["shared_videos"] += 1

        if video:
            learner_map[learner.id]["videos"].append({
                "video_id": video.id,
                "title": video.title,
                "status": video.status
            })

    learners = list(learner_map.values())

    total_learners = len(learners)

    # =====================================================
    # Final Response
    # =====================================================

    return {

        "educator_id": educator_id,

        "total_learners": total_learners,

        "learners": learners,

        "total_videos": total_videos,

        "processed_videos": processed_videos,

        "uploaded_videos": uploaded_videos,

        "shared_videos": total_shared_videos,

        "total_duration": total_duration,

        "average_duration": average_duration,

        "transcripts_generated": transcripts_generated,

        "summaries_generated": summaries_generated
    }