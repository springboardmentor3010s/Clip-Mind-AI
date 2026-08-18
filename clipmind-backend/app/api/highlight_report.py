from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.auth.authorization import require_roles
from app.auth.oauth2 import get_current_user
from app.core.enums import UserRole, ActivityType

from app.crud.video import get_video_by_id
from app.crud.summary import get_summary_by_type
from app.crud.key_moment import get_key_moments_by_video

from app.schemas.highlight_report import HighlightReportResponse

from app.services.highlight_report_service import (
    generate_highlight_report
)

from app.services.activity_service import log_activity


router = APIRouter(
    tags=["Highlight Reports"]
)


# ============================================================
# HELPER FUNCTION
# Build the highlight report from existing video data
# ============================================================

def build_highlight_report(
    video_id: int,
    current_user,
    db: Session
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
    # 2. Get short summary
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
    # 3. Get stored key moments
    # ---------------------------------------------------------

    key_moments = get_key_moments_by_video(
        db=db,
        video_id=video.id
    )

    if not key_moments:
        raise HTTPException(
            status_code=404,
            detail="Key moments not found. Generate key moments first."
        )

    # ---------------------------------------------------------
    # 4. Generate highlight report
    # ---------------------------------------------------------

    report = generate_highlight_report(
        video=video,
        summary=summary,
        key_moments=key_moments
    )

    return video, report


# ============================================================
# GENERATE HIGHLIGHT REPORT
# ============================================================

@router.post(
    "/videos/{video_id}/highlight-report/generate",
    response_model=HighlightReportResponse
)
def generate_video_highlight_report(
    video_id: int,
    current_user=Depends(
        require_roles(
            UserRole.CONTENT_CREATOR,
            UserRole.EDUCATOR,
            UserRole.ADMIN
        )
    ),
    db: Session = Depends(get_db)
):

    video, report = build_highlight_report(
        video_id=video_id,
        current_user=current_user,
        db=db
    )

    # Log highlight generation activity
    log_activity(
        db=db,
        user=current_user,
        activity_type=ActivityType.HIGHLIGHT_REPORT_GENERATED,
        entity_name=video.filename
    )

    return report


# ============================================================
# VIEW HIGHLIGHT REPORT
# ============================================================

@router.get(
    "/videos/{video_id}/highlight-report",
    response_model=HighlightReportResponse
)
def get_video_highlight_report(
    video_id: int,
    current_user=Depends(
        require_roles(
            UserRole.CONTENT_CREATOR,
            UserRole.EDUCATOR,
            UserRole.ADMIN
        )
    ),
    db: Session = Depends(get_db)
):

    video, report = build_highlight_report(
        video_id=video_id,
        current_user=current_user,
        db=db
    )

    # Log highlight viewing activity
    log_activity(
        db=db,
        user=current_user,
        activity_type=ActivityType.HIGHLIGHT_REPORT_VIEWED,
        entity_name=video.filename
    )

    return report