from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.auth.authorization import require_roles
from app.core.enums import UserRole

from app.models.summary import Summary
from app.models.video import Video
from app.models.classroom import Classroom

from app.schemas.summary import SummaryResponse
from app.schemas.summary_share import (
    SummaryShareCreate,
    SummaryShareResponse,
)

from app.crud.summary_share import (
    create_summary_share,
    get_shared_summaries_for_learner,
)


router = APIRouter(
    prefix="/summary-shares",
    tags=["Summary Shares"],
)


# ============================================================
# SHARE SUMMARY WITH A CLASSROOM
# Educator only
# ============================================================

@router.post(
    "",
    response_model=SummaryShareResponse,
    status_code=status.HTTP_201_CREATED,
)
def share_summary(
    share_data: SummaryShareCreate,
    current_user=Depends(
        require_roles(UserRole.EDUCATOR)
    ),
    db: Session = Depends(get_db),
):

    # --------------------------------------------------------
    # Verify that the summary exists
    # --------------------------------------------------------

    summary = (
        db.query(Summary)
        .filter(Summary.id == share_data.summary_id)
        .first()
    )

    if summary is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Summary not found",
        )

    # --------------------------------------------------------
    # Verify that the summary belongs to a video owned
    # by the logged-in educator
    # --------------------------------------------------------

    video = (
        db.query(Video)
        .filter(Video.id == summary.video_id)
        .first()
    )

    if video is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video associated with this summary was not found",
        )

    if video.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only share summaries from your own videos",
        )

    # --------------------------------------------------------
    # Verify that the classroom exists and belongs
    # to the logged-in educator
    # --------------------------------------------------------

    classroom = (
        db.query(Classroom)
        .filter(
            Classroom.id == share_data.classroom_id,
            Classroom.educator_id == current_user.id,
        )
        .first()
    )

    if classroom is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Classroom not found or you do not have access to it",
        )

    # --------------------------------------------------------
    # Create the summary share record
    # --------------------------------------------------------

    summary_share = create_summary_share(
        db=db,
        summary_id=share_data.summary_id,
        classroom_id=share_data.classroom_id,
        shared_by=current_user.id,
    )

    return summary_share


# ============================================================
# GET SUMMARIES SHARED WITH THE LOGGED-IN LEARNER
# Learner only
# ============================================================

@router.get(
    "/my",
    response_model=List[SummaryResponse],
)
def get_my_shared_summaries(
    current_user=Depends(
        require_roles(UserRole.LEARNER)
    ),
    db: Session = Depends(get_db),
):

    summaries = get_shared_summaries_for_learner(
        db=db,
        learner_id=current_user.id,
    )

    return summaries