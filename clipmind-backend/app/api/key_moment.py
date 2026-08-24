from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.auth.authorization import require_roles
from app.core.enums import UserRole, ActivityType
from app.auth.oauth2 import get_current_user

from app.crud.video import (
    get_video_by_id,
    get_available_video_by_id,
    get_user_videos
)

from app.models.key_moment import KeyMoment

from app.crud.transcript_segment import get_transcript_segments_by_video
from app.crud.summary import get_summary_by_type

from app.crud.key_moment import (
    create_key_moment,
    get_key_moments_by_video,
    delete_key_moments_by_video
)

from app.schemas.key_moment import KeyMomentResponse
from app.services.key_moment_service import detect_key_moments
from app.services.activity_service import log_activity


router = APIRouter(
    tags=["Key Moments"]
)


# ============================================================
# GENERATE KEY MOMENTS
# Content Creator, Educator and Admin
# ============================================================

@router.post(
    "/videos/{video_id}/key-moments/generate",
    response_model=List[KeyMomentResponse]
)
def generate_video_key_moments(
    video_id: int,
    max_moments: int = Query(
        default=5,
        ge=1,
        le=10
    ),
    current_user=Depends(
        require_roles(
            UserRole.CONTENT_CREATOR,
            UserRole.EDUCATOR,
            UserRole.ADMIN
        )
    ),
    db: Session = Depends(get_db)
):

    # 1. Verify that the video belongs to the current user
    video = get_video_by_id(
        db=db,
        video_id=video_id,
        owner_id=current_user.id
    )

    if video is None:
        raise HTTPException(
            status_code=404,
            detail="Video not found"
        )

    # 2. Get transcript segments
    segments = get_transcript_segments_by_video(
        db=db,
        video_id=video.id
    )

    if not segments:
        raise HTTPException(
            status_code=404,
            detail="Transcript segments not found"
        )

    # 3. Get the short summary
    summary = get_summary_by_type(
        db=db,
        video=video,
        summary_type="short"
    )

    if summary is None:
        raise HTTPException(
            status_code=404,
            detail="Short summary not found"
        )

    # 4. Run key moment detection
    detected_moments = detect_key_moments(
        segments=segments,
        summary_text=summary.summary_text,
        max_moments=max_moments
    )

    if not detected_moments:
        raise HTTPException(
            status_code=404,
            detail="No key moments could be detected"
        )

    # 5. Remove previously generated key moments
    delete_key_moments_by_video(
        db=db,
        video_id=video.id
    )

    # 6. Save newly detected key moments
    saved_moments = []

    for moment in detected_moments:

        key_moment = create_key_moment(
            db=db,
            video_id=video.id,
            transcript_segment_id=moment["transcript_segment_id"],
            start_time=moment["start_time"],
            end_time=moment["end_time"],
            title=moment["title"],
            segment_text=moment["segment_text"],
            importance_score=moment["importance_score"]
        )

        saved_moments.append(key_moment)

    # 7. Log key moment generation activity
    log_activity(
        db=db,
        user=current_user,
        activity_type=ActivityType.KEY_MOMENTS_DETECTED,
        entity_name=video.filename
    )

    return saved_moments


# ============================================================
# GET ALL KEY MOMENTS FOR CURRENT USER'S VIDEOS
# Content Creator / Educator / Admin
# ============================================================

@router.get("/key-moments/my")
def get_my_key_moments(
    current_user=Depends(
        require_roles(
            UserRole.CONTENT_CREATOR,
            UserRole.EDUCATOR,
            UserRole.ADMIN
        )
    ),
    db: Session = Depends(get_db)
):

    videos = get_user_videos(
        db=db,
        owner_id=current_user.id
    )

    results = []

    for video in videos:

        key_moments = (
            db.query(KeyMoment)
            .filter(
                KeyMoment.video_id == video.id
            )
            .order_by(
                KeyMoment.start_time
            )
            .all()
        )

        results.append(
            {
                "video_id": video.id,
                "video_filename": video.filename,
                "video_status": video.status,
                "key_moments": key_moments
            }
        )

    return results


# ============================================================
# VIEW KEY MOMENTS
# Learner/Admin -> Available videos
# Content Creator/Educator -> Their own videos
# ============================================================

@router.get(
    "/videos/{video_id}/key-moments",
    response_model=List[KeyMomentResponse]
)
def get_video_key_moments(
    video_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Learner and Admin can view available videos
    if current_user.role in [
        UserRole.LEARNER,
        UserRole.ADMIN
    ]:

        video = get_available_video_by_id(
            db=db,
            video_id=video_id
        )

    # Content Creator and Educator can view only their own videos
    else:

        video = get_video_by_id(
            db=db,
            video_id=video_id,
            owner_id=current_user.id
        )

    if video is None:
        raise HTTPException(
            status_code=404,
            detail="Video not found"
        )

    # Get key moments
    key_moments = get_key_moments_by_video(
        db=db,
        video_id=video.id
    )

    # Log viewing activity
    log_activity(
        db=db,
        user=current_user,
        activity_type=ActivityType.KEY_MOMENTS_VIEWED,
        entity_name=video.filename
    )

    return key_moments