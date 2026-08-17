from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.auth.authorization import require_roles
from app.core.enums import UserRole

from app.crud.video import get_video_by_id
from app.crud.summary import get_summary_by_type
from app.crud.key_moment import get_key_moments_by_video

from app.schemas.highlight_report import HighlightReportResponse

from app.services.highlight_report_service import (
    generate_highlight_report
)


router = APIRouter(
    tags=["Highlight Reports"]
)


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

    return report