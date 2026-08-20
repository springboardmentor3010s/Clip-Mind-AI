"""
Classroom Module.

An Educator creates a Classroom and gets an invite code back; a Learner
joins with that code, creating a ClassroomMembership row. This is the
grouping concept "share with my class" and "classroom analytics" need —
previously the only sharing primitive was VideoShare, which is strictly
one video shared with one named person at a time.
"""
import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.classroom import Classroom, generate_invite_code
from app.models.classroom_membership import ClassroomMembership
from app.models.user import User, UserRole
from app.services.audit_service import log_action


def _to_out_dict(classroom: Classroom, educator_name: str | None, student_count: int) -> dict:
    return {
        "id": classroom.id,
        "name": classroom.name,
        "educator_id": classroom.educator_id,
        "educator_name": educator_name,
        "invite_code": classroom.invite_code,
        "student_count": student_count,
        "created_at": classroom.created_at,
    }


def _student_count(db: Session, classroom_id: uuid.UUID) -> int:
    return db.query(ClassroomMembership).filter(ClassroomMembership.classroom_id == classroom_id).count()


def create_classroom(db: Session, name: str, educator: User) -> dict:
    """Educator-only: create a new classroom with a fresh unique invite code."""
    code = generate_invite_code()
    while db.query(Classroom).filter(Classroom.invite_code == code).first():
        code = generate_invite_code()  # astronomically rare, but don't silently collide

    classroom = Classroom(name=name.strip(), educator_id=educator.id, invite_code=code)
    db.add(classroom)
    db.commit()
    db.refresh(classroom)

    log_action(db, actor_id=educator.id, action="classroom.created", target_type="classroom", target_id=classroom.id)

    return _to_out_dict(classroom, educator.full_name, 0)


def get_classroom_or_404(db: Session, classroom_id: uuid.UUID) -> Classroom:
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found.")
    return classroom


def _require_owner(classroom: Classroom, educator: User) -> None:
    if classroom.educator_id != educator.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the classroom's educator can do this.",
        )


def list_my_classrooms(db: Session, user: User) -> list[dict]:
    """
    Educator: classrooms they created. Learner: classrooms they're enrolled in.
    Other roles: empty list (classrooms aren't relevant to them).
    """
    if user.role == UserRole.EDUCATOR:
        rows = db.query(Classroom).filter(Classroom.educator_id == user.id).order_by(Classroom.created_at.desc()).all()
        return [_to_out_dict(c, user.full_name, _student_count(db, c.id)) for c in rows]

    if user.role == UserRole.LEARNER:
        rows = (
            db.query(Classroom, User.full_name)
            .join(ClassroomMembership, ClassroomMembership.classroom_id == Classroom.id)
            .join(User, User.id == Classroom.educator_id)
            .filter(ClassroomMembership.student_id == user.id)
            .order_by(ClassroomMembership.joined_at.desc())
            .all()
        )
        return [_to_out_dict(c, educator_name, _student_count(db, c.id)) for c, educator_name in rows]

    return []


def join_classroom(db: Session, invite_code: str, student: User) -> dict:
    """Learner-only: enroll in a classroom via its invite code. Idempotent."""
    if student.role != UserRole.LEARNER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only learners can join a classroom.")

    classroom = db.query(Classroom).filter(Classroom.invite_code == invite_code.strip().upper()).first()
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid invite code.")

    existing = (
        db.query(ClassroomMembership)
        .filter(ClassroomMembership.classroom_id == classroom.id, ClassroomMembership.student_id == student.id)
        .first()
    )
    if not existing:
        db.add(ClassroomMembership(classroom_id=classroom.id, student_id=student.id))
        db.commit()
        log_action(
            db,
            actor_id=student.id,
            action="classroom.joined",
            target_type="classroom",
            target_id=classroom.id,
        )

    educator = db.query(User).filter(User.id == classroom.educator_id).first()
    return _to_out_dict(classroom, educator.full_name if educator else None, _student_count(db, classroom.id))


def get_roster(db: Session, classroom_id: uuid.UUID, educator: User) -> list[dict]:
    """Educator-only (must own the classroom): list enrolled students."""
    classroom = get_classroom_or_404(db, classroom_id)
    _require_owner(classroom, educator)

    rows = (
        db.query(ClassroomMembership, User)
        .join(User, User.id == ClassroomMembership.student_id)
        .filter(ClassroomMembership.classroom_id == classroom_id)
        .order_by(ClassroomMembership.joined_at.asc())
        .all()
    )
    return [
        {
            "id": membership.id,
            "student_id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "joined_at": membership.joined_at,
        }
        for membership, user in rows
    ]


def remove_member(db: Session, classroom_id: uuid.UUID, student_id: uuid.UUID, educator: User) -> None:
    """Educator-only (must own the classroom): remove a student from the roster."""
    classroom = get_classroom_or_404(db, classroom_id)
    _require_owner(classroom, educator)

    membership = (
        db.query(ClassroomMembership)
        .filter(ClassroomMembership.classroom_id == classroom_id, ClassroomMembership.student_id == student_id)
        .first()
    )
    if not membership:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student is not enrolled in this classroom.")

    db.delete(membership)
    db.commit()
    log_action(
        db,
        actor_id=educator.id,
        action="classroom.member_removed",
        target_type="classroom",
        target_id=classroom_id,
    )


def delete_classroom(db: Session, classroom_id: uuid.UUID, educator: User) -> None:
    """Educator-only (must own the classroom): delete it and all memberships."""
    classroom = get_classroom_or_404(db, classroom_id)
    _require_owner(classroom, educator)

    db.query(ClassroomMembership).filter(ClassroomMembership.classroom_id == classroom_id).delete()
    db.delete(classroom)
    db.commit()
    log_action(
        db,
        actor_id=educator.id,
        action="classroom.deleted",
        target_type="classroom",
        target_id=classroom_id,
    )