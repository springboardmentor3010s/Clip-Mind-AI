from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.auth.oauth2 import get_current_user

from app.crud.video import get_video_by_id
from app.crud.transcript_segment import get_transcript_segments_by_video
from app.crud.summary import get_summary_by_type

from app.crud.key_moment import (
    create_key_moment,
    get_key_moments_by_video,
    delete_key_moments_by_video
)

from app.schemas.key_moment import KeyMomentResponse

from app.services.key_moment_service import detect_key_moments


router = APIRouter(
    tags=["Key Moments"]
)


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
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # ---------------------------------------------------------
    # 1. Verify that the video belongs to the current user
    # ---------------------------------------------------------

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

    # ---------------------------------------------------------
    # 2. Get transcript segments
    # ---------------------------------------------------------

    segments = get_transcript_segments_by_video(
        db=db,
        video_id=video.id
    )

    if not segments:
        raise HTTPException(
            status_code=404,
            detail="Transcript segments not found"
        )

    # ---------------------------------------------------------
    # 3. Get the short summary
    # ---------------------------------------------------------

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

    # ---------------------------------------------------------
    # 4. Run key moment detection
    # ---------------------------------------------------------

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

    # ---------------------------------------------------------
    # 5. Remove previously generated moments
    # ---------------------------------------------------------

    delete_key_moments_by_video(
        db=db,
        video_id=video.id
    )

    # ---------------------------------------------------------
    # 6. Save newly detected moments
    # ---------------------------------------------------------

    saved_moments = []

    for moment in detected_moments:

        key_moment = create_key_moment(
            db=db,
            video_id=video.id,
            transcript_segment_id=moment[
                "transcript_segment_id"
            ],
            start_time=moment["start_time"],
            end_time=moment["end_time"],
            title=moment["title"],
            segment_text=moment["segment_text"],
            importance_score=moment[
                "importance_score"
            ]
        )

        saved_moments.append(key_moment)

    return saved_moments


@router.get(
    "/videos/{video_id}/key-moments",
    response_model=List[KeyMomentResponse]
)
def get_video_key_moments(
    video_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # ---------------------------------------------------------
    # 1. Verify video ownership
    # ---------------------------------------------------------

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

    # ---------------------------------------------------------
    # 2. Retrieve generated key moments
    # ---------------------------------------------------------

    key_moments = get_key_moments_by_video(
        db=db,
        video_id=video.id
    )

    return key_moments