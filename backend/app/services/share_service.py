from sqlalchemy.orm import Session

from app.models.shared_video import SharedVideo
from app.models.video import Video
from app.models.user import User


# =====================================================
# Share Video with Learner
# =====================================================

def share_video(
    db: Session,
    educator_id: int,
    learner_id: int,
    video_id: int
):

    # Check video exists
    video = db.query(Video).filter(
        Video.id == video_id
    ).first()

    if not video:
        return {
            "success": False,
            "message": "Video not found."
        }

    # Check learner exists
    learner = db.query(User).filter(
        User.id == learner_id
    ).first()

    if not learner:
        return {
            "success": False,
            "message": "Learner not found."
        }

    # Prevent duplicate share
    existing = db.query(SharedVideo).filter(
        SharedVideo.video_id == video_id,
        SharedVideo.educator_id == educator_id,
        SharedVideo.learner_id == learner_id
    ).first()

    if existing:
        return {
            "success": False,
            "message": "Lecture already shared."
        }

    shared = SharedVideo(
        video_id=video_id,
        educator_id=educator_id,
        learner_id=learner_id
    )

    db.add(shared)
    db.commit()
    db.refresh(shared)

    return {
        "success": True,
        "message": "Lecture shared successfully.",
        "share_id": shared.id
    }


# =====================================================
# Get All Shared Videos by Educator
# =====================================================

def get_shared_videos(
    db: Session,
    educator_id: int
):

    shared = (
        db.query(SharedVideo)
        .filter(
            SharedVideo.educator_id == educator_id
        )
        .all()
    )

    result = []

    for item in shared:

        video = db.query(Video).filter(
            Video.id == item.video_id
        ).first()

        learner = db.query(User).filter(
            User.id == item.learner_id
        ).first()

        result.append({
            "share_id": item.id,
            "video_id": item.video_id,
            "title": video.title if video else "",
            "learner_id": item.learner_id,
            "learner_name": learner.full_name if learner else "",
            "shared_at": item.shared_at
        })

    return {
        "success": True,
        "count": len(result),
        "shared_videos": result
    }


# =====================================================
# Get Videos Shared with Learner
# =====================================================

def get_learner_videos(
    db: Session,
    learner_id: int
):

    shared = (
        db.query(SharedVideo)
        .filter(
            SharedVideo.learner_id == learner_id
        )
        .all()
    )

    result = []

    for item in shared:

        video = db.query(Video).filter(
            Video.id == item.video_id
        ).first()

        educator = db.query(User).filter(
            User.id == item.educator_id
        ).first()

        result.append({

            "share_id": item.id,

            "video_id": item.video_id,

            "title": video.title if video else "",

            "educator_id": item.educator_id,

            "educator_name": educator.full_name if educator else "",

            "shared_at": item.shared_at

        })

    return {
        "success": True,
        "count": len(result),
        "videos": result
    }


# =====================================================
# Remove Shared Lecture
# =====================================================

def delete_share(
    db: Session,
    share_id: int
):

    shared = db.query(SharedVideo).filter(
        SharedVideo.id == share_id
    ).first()

    if not shared:
        return {
            "success": False,
            "message": "Shared lecture not found."
        }

    db.delete(shared)
    db.commit()

    return {
        "success": True,
        "message": "Shared lecture removed successfully."
    }