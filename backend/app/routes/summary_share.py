from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    User,
    Video,
    Classroom,
    ClassroomMember,
    SummaryShare
)
from app.utils.role_guard import require_roles


router = APIRouter(
    prefix="/summary-shares",
    tags=["Summary Shares"]
)


class ShareSummaryRequest(BaseModel):
    video_id: int
    classroom_id: int


# =========================================================
# SHARE SUMMARY WITH CLASSROOM
# =========================================================

@router.post("/")
def share_summary(
    data: ShareSummaryRequest,
    current_user: User = Depends(
        require_roles("educator")
    ),
    db: Session = Depends(get_db),
):

    video = (
        db.query(Video)
        .filter(Video.id == data.video_id)
        .first()
    )

    if video is None:
        raise HTTPException(
            status_code=404,
            detail="Video not found."
        )

    if video.uploaded_by != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only share your own videos."
        )

    if video.status != "Completed":
        raise HTTPException(
            status_code=400,
            detail="Video processing is not completed yet."
        )

    if not video.summary:
        raise HTTPException(
            status_code=400,
            detail="This video does not have an AI summary yet."
        )

    classroom = (
        db.query(Classroom)
        .filter(Classroom.id == data.classroom_id)
        .first()
    )

    if classroom is None:
        raise HTTPException(
            status_code=404,
            detail="Classroom not found."
        )

    if classroom.created_by != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only share with your own classrooms."
        )

    # Make sure video belongs to this classroom
    if video.classroom_id != classroom.id:
        raise HTTPException(
            status_code=400,
            detail="This video is not associated with the selected classroom."
        )

    existing_share = (
        db.query(SummaryShare)
        .filter(
            SummaryShare.video_id == data.video_id,
            SummaryShare.classroom_id == data.classroom_id
        )
        .first()
    )

    if existing_share:
        raise HTTPException(
            status_code=400,
            detail="This lecture has already been shared with this classroom."
        )

    summary_share = SummaryShare(
        video_id=data.video_id,
        classroom_id=data.classroom_id
    )

    db.add(summary_share)
    db.commit()
    db.refresh(summary_share)

    return {
        "message": "Lecture shared successfully.",
        "share": {
            "id": summary_share.id,
            "video_id": summary_share.video_id,
            "classroom_id": summary_share.classroom_id
        }
    }


# =========================================================
# GET SHARED LECTURES FOR CLASSROOM
# =========================================================

@router.get("/classroom/{classroom_id}")
def get_classroom_shared_summaries(
    classroom_id: int,
    current_user: User = Depends(
        require_roles("educator", "learner")
    ),
    db: Session = Depends(get_db),
):

    classroom = (
        db.query(Classroom)
        .filter(Classroom.id == classroom_id)
        .first()
    )

    if classroom is None:
        raise HTTPException(
            status_code=404,
            detail="Classroom not found."
        )

    # -----------------------------------------------------
    # EDUCATOR ACCESS
    # -----------------------------------------------------

    if current_user.role == "educator":

        if classroom.created_by != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can only access your own classrooms."
            )

    # -----------------------------------------------------
    # LEARNER ACCESS
    # -----------------------------------------------------

    if current_user.role == "learner":

        membership = (
            db.query(ClassroomMember)
            .filter(
                ClassroomMember.classroom_id == classroom_id,
                ClassroomMember.student_id == current_user.id
            )
            .first()
        )

        if membership is None:
            raise HTTPException(
                status_code=403,
                detail="You have not joined this classroom."
            )

    # -----------------------------------------------------
    # GET SHARED LECTURES
    # -----------------------------------------------------

    shares = (
        db.query(SummaryShare)
        .filter(
            SummaryShare.classroom_id == classroom_id
        )
        .order_by(SummaryShare.id.desc())
        .all()
    )

    result = []

    for share in shares:

        video = share.video

        result.append({
            "share_id": share.id,

            "video_id": video.id,

            "classroom_id": classroom.id,

            "filename": video.filename,

            "original_filename": video.original_filename,

            "status": video.status,

            "language": video.language,

            "transcript": video.transcript,

            "summary": video.summary,

            "short_summary": video.short_summary,

            "timestamps": video.timestamps,

            "key_moments": video.key_moments,

            "keywords": video.keywords,

            "topics": video.topics,

            "highlight_report": video.highlight_report,

            "uploaded_by": video.uploaded_by
        })

    return result


# =========================================================
# GET ONE SHARED LECTURE
# =========================================================

@router.get("/{share_id}")
def get_shared_lecture(
    share_id: int,
    current_user: User = Depends(
        require_roles("educator", "learner")
    ),
    db: Session = Depends(get_db),
):

    share = (
        db.query(SummaryShare)
        .filter(
            SummaryShare.id == share_id
        )
        .first()
    )

    if share is None:
        raise HTTPException(
            status_code=404,
            detail="Shared lecture not found."
        )

    classroom = share.classroom

    # -----------------------------------------------------
    # EDUCATOR ACCESS
    # -----------------------------------------------------

    if current_user.role == "educator":

        if classroom.created_by != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You do not have access to this lecture."
            )

    # -----------------------------------------------------
    # LEARNER ACCESS
    # -----------------------------------------------------

    elif current_user.role == "learner":

        membership = (
            db.query(ClassroomMember)
            .filter(
                ClassroomMember.classroom_id == classroom.id,
                ClassroomMember.student_id == current_user.id
            )
            .first()
        )

        if membership is None:
            raise HTTPException(
                status_code=403,
                detail="You have not joined this classroom."
            )

    video = share.video

    return {
        "share_id": share.id,
        "video_id": video.id,
        "classroom_id": classroom.id,

        "filename": video.filename,
        "original_filename": video.original_filename,

        "status": video.status,
        "language": video.language,

        "transcript": video.transcript,
        "summary": video.summary,
        "short_summary": video.short_summary,

        "timestamps": video.timestamps,
        "key_moments": video.key_moments,
        "keywords": video.keywords,
        "topics": video.topics,

        "highlight_report": video.highlight_report,

        "uploaded_by": video.uploaded_by
    }