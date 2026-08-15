from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.auth.oauth2 import get_current_user

from app.crud.video import get_video_by_id

from app.schemas.analytics import (
    VideoAnalyticsResponse
)

from app.services.analytics_service import (
    generate_video_analytics
)


router = APIRouter(
    tags=["Analytics"]
)


@router.get(
    "/videos/{video_id}/analytics",
    response_model=VideoAnalyticsResponse
)
def get_video_analytics(
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
    # 2. Generate analytics
    # ---------------------------------------------------------

    analytics = generate_video_analytics(
        db=db,
        video=video
    )

    return analytics