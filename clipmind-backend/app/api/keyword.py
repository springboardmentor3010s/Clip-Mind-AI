from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.auth.oauth2 import get_current_user

from app.crud.video import get_video_by_id
from app.crud.transcript_segment import (
    get_transcript_segments_by_video
)

from app.crud.keyword import (
    create_keywords,
    get_keywords_by_video,
    delete_keywords_by_video
)

from app.schemas.keyword import KeywordResponse

from app.services.activity_service import log_activity
from app.core.enums import ActivityType

from app.services.keyword_extraction_service import (
    extract_keywords
)


router = APIRouter(
    tags=["Keywords"]
)


@router.post(
    "/videos/{video_id}/keywords/generate",
    response_model=List[KeywordResponse]
)
def generate_video_keywords(
    video_id: int,
    max_keywords: int = Query(
        default=15,
        ge=1,
        le=30
    ),
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
    # 2. Get timestamped transcript segments
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
    # 3. Extract keywords
    # ---------------------------------------------------------

    extracted_keywords = extract_keywords(
        segments=segments,
        max_keywords=max_keywords
    )

    if not extracted_keywords:
        raise HTTPException(
            status_code=404,
            detail="No keywords could be extracted"
        )

    # ---------------------------------------------------------
    # 4. Delete previously generated keywords
    # ---------------------------------------------------------

    delete_keywords_by_video(
        db=db,
        video_id=video.id
    )

    # ---------------------------------------------------------
    # 5. Save new keywords
    # ---------------------------------------------------------

    saved_keywords = create_keywords(
        db=db,
        video_id=video.id,
        keywords=extracted_keywords
    )

    log_activity(
        db=db,
        user=current_user,
        activity_type=ActivityType.KEYWORDS_GENERATED,
        entity_name=video.filename
    )

    return saved_keywords


@router.get(
    "/videos/{video_id}/keywords",
    response_model=List[KeywordResponse]
)
def get_video_keywords(
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
    # 2. Retrieve stored keywords
    # ---------------------------------------------------------

    keywords = get_keywords_by_video(
        db=db,
        video_id=video.id
    )

    log_activity(
        db=db,
        user=current_user,
        activity_type=ActivityType.KEYWORDS_VIEWED,
        entity_name=video.filename
    )

    return keywords