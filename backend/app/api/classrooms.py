from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_db, require_role, require_user
from app.core.audit import record_audit_event
from app.models.user import User
from app.models.video import Video
from app.models.bookmark import Bookmark
from app.models.analytics import AnalyticsEvent
from app.models.classroom import Classroom, ClassroomMembership, ClassroomVideo
from app.schemas.classroom import (
    ClassroomCreate,
    ClassroomResponse,
    ClassroomDetailResponse,
    StudentAdd,
    VideoAssign,
)

router = APIRouter(prefix="/classrooms", tags=["classrooms"])

require_educator = require_role("Educator")


def _get_owned_classroom(classroom_id: int, current_user: User, db: Session) -> Classroom:
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    if str(classroom.educator_id) != str(current_user.id) and current_user.role.name != "Administrator":
        raise HTTPException(status_code=403, detail="You don't own this classroom")
    return classroom


def _to_summary(classroom: Classroom, db: Session) -> dict:
    return {
        "id": classroom.id,
        "name": classroom.name,
        "educator_id": str(classroom.educator_id),
        "educator_username": classroom.educator.username if classroom.educator else None,
        "created_at": classroom.created_at,
        "student_count": db.query(ClassroomMembership).filter(ClassroomMembership.classroom_id == classroom.id).count(),
        "video_count": db.query(ClassroomVideo).filter(ClassroomVideo.classroom_id == classroom.id).count(),
    }


@router.post("", response_model=ClassroomResponse)
def create_classroom(
    req: ClassroomCreate,
    current_user: User = Depends(require_educator),
    db: Session = Depends(get_db),
):
    classroom = Classroom(name=req.name, educator_id=current_user.id)
    db.add(classroom)
    db.commit()
    db.refresh(classroom)
    return _to_summary(classroom, db)


@router.get("/mine", response_model=List[ClassroomResponse])
def list_my_classrooms(
    current_user: User = Depends(require_educator),
    db: Session = Depends(get_db),
):
    query = db.query(Classroom)
    if current_user.role.name != "Administrator":
        query = query.filter(Classroom.educator_id == current_user.id)
    classrooms = query.order_by(Classroom.created_at.desc()).all()
    return [_to_summary(c, db) for c in classrooms]


@router.get("/joined", response_model=List[ClassroomResponse])
def list_joined_classrooms(
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """A Learner's view: classrooms they've been added to."""
    memberships = db.query(ClassroomMembership).filter(ClassroomMembership.student_id == current_user.id).all()
    classrooms = [m.classroom for m in memberships]
    return [_to_summary(c, db) for c in classrooms]


@router.get("/{classroom_id}", response_model=ClassroomDetailResponse)
def get_classroom(
    classroom_id: int,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")

    is_owner = str(classroom.educator_id) == str(current_user.id) or current_user.role.name == "Administrator"
    is_member = db.query(ClassroomMembership).filter(
        ClassroomMembership.classroom_id == classroom_id,
        ClassroomMembership.student_id == current_user.id,
    ).first() is not None
    if not is_owner and not is_member:
        raise HTTPException(status_code=403, detail="You don't have access to this classroom")

    memberships = db.query(ClassroomMembership).filter(ClassroomMembership.classroom_id == classroom_id).all()
    videos = db.query(ClassroomVideo).filter(ClassroomVideo.classroom_id == classroom_id).all()

    summary = _to_summary(classroom, db)
    return {
        **summary,
        "students": [
            {"id": str(m.student.id), "username": m.student.username, "email": m.student.email, "joined_at": m.joined_at}
            for m in memberships if m.student
        ],
        "videos": [
            {"id": v.video.id, "title": v.video.title, "status": v.video.status.value if hasattr(v.video.status, "value") else v.video.status, "added_at": v.added_at}
            for v in videos if v.video
        ],
    }


@router.delete("/{classroom_id}")
def delete_classroom(
    classroom_id: int,
    current_user: User = Depends(require_educator),
    db: Session = Depends(get_db),
):
    classroom = _get_owned_classroom(classroom_id, current_user, db)
    db.delete(classroom)
    db.commit()
    return {"message": "Classroom deleted."}


@router.post("/{classroom_id}/students", response_model=ClassroomDetailResponse)
def add_student(
    classroom_id: int,
    req: StudentAdd,
    current_user: User = Depends(require_educator),
    db: Session = Depends(get_db),
):
    classroom = _get_owned_classroom(classroom_id, current_user, db)

    student = db.query(User).filter(User.email == req.email).first()
    if not student:
        raise HTTPException(status_code=404, detail="No user found with that email.")
    if student.role.name != "Learner":
        raise HTTPException(status_code=400, detail="Only Learner accounts can be added to a classroom.")

    existing = db.query(ClassroomMembership).filter(
        ClassroomMembership.classroom_id == classroom_id,
        ClassroomMembership.student_id == student.id,
    ).first()
    if not existing:
        db.add(ClassroomMembership(classroom_id=classroom_id, student_id=student.id))
        db.commit()

    return get_classroom(classroom_id, current_user, db)


@router.delete("/{classroom_id}/students/{student_id}", response_model=ClassroomDetailResponse)
def remove_student(
    classroom_id: int,
    student_id: str,
    current_user: User = Depends(require_educator),
    db: Session = Depends(get_db),
):
    _get_owned_classroom(classroom_id, current_user, db)
    db.query(ClassroomMembership).filter(
        ClassroomMembership.classroom_id == classroom_id,
        ClassroomMembership.student_id == student_id,
    ).delete()
    db.commit()
    return get_classroom(classroom_id, current_user, db)


@router.post("/{classroom_id}/videos", response_model=ClassroomDetailResponse)
def assign_video(
    classroom_id: int,
    req: VideoAssign,
    current_user: User = Depends(require_educator),
    db: Session = Depends(get_db),
):
    classroom = _get_owned_classroom(classroom_id, current_user, db)

    video = db.query(Video).filter(Video.id == req.video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    existing = db.query(ClassroomVideo).filter(
        ClassroomVideo.classroom_id == classroom_id,
        ClassroomVideo.video_id == req.video_id,
    ).first()
    if not existing:
        db.add(ClassroomVideo(classroom_id=classroom_id, video_id=req.video_id))
        db.commit()

    return get_classroom(classroom_id, current_user, db)


@router.delete("/{classroom_id}/videos/{video_id}", response_model=ClassroomDetailResponse)
def unassign_video(
    classroom_id: int,
    video_id: int,
    current_user: User = Depends(require_educator),
    db: Session = Depends(get_db),
):
    _get_owned_classroom(classroom_id, current_user, db)
    db.query(ClassroomVideo).filter(
        ClassroomVideo.classroom_id == classroom_id,
        ClassroomVideo.video_id == video_id,
    ).delete()
    db.commit()
    return get_classroom(classroom_id, current_user, db)


@router.get("/{classroom_id}/analytics")
def get_classroom_analytics(
    classroom_id: int,
    current_user: User = Depends(require_educator),
    db: Session = Depends(get_db),
):
    """Per-video engagement among this classroom's students only: views,
    bookmarks (video/summary/highlight), and Study Mode engagement."""
    classroom = _get_owned_classroom(classroom_id, current_user, db)

    student_ids = {
        str(m.student_id)
        for m in db.query(ClassroomMembership).filter(ClassroomMembership.classroom_id == classroom_id).all()
    }
    videos = db.query(ClassroomVideo).filter(ClassroomVideo.classroom_id == classroom_id).all()

    per_video = []
    for cv in videos:
        video = cv.video
        if not video:
            continue

        events = db.query(AnalyticsEvent).filter(AnalyticsEvent.video_id == video.id).all()
        class_events = [e for e in events if e.user_id and str(e.user_id) in student_ids]

        views = sum(1 for e in class_events if e.event_type == "video_view")
        unique_viewers = len({str(e.user_id) for e in class_events if e.event_type == "video_view"})
        study_mode_starts = sum(1 for e in class_events if e.event_type == "study_mode_started")
        unique_study_engagers = len({str(e.user_id) for e in class_events if e.event_type == "study_mode_started"})

        bookmarks = db.query(Bookmark).filter(Bookmark.video_id == video.id).all()
        class_bookmarks = [b for b in bookmarks if str(b.user_id) in student_ids]
        bookmarks_by_type = {}
        for b in class_bookmarks:
            bookmarks_by_type[b.target_type] = bookmarks_by_type.get(b.target_type, 0) + 1

        per_video.append({
            "video_id": video.id,
            "video_title": video.title,
            "views": views,
            "unique_viewers": unique_viewers,
            "bookmarks_by_type": bookmarks_by_type,
            "total_bookmarks": len(class_bookmarks),
            "study_mode_starts": study_mode_starts,
            "unique_study_engagers": unique_study_engagers,
        })

    return {
        "classroom_id": classroom_id,
        "classroom_name": classroom.name,
        "student_count": len(student_ids),
        "videos": per_video,
    }
