from sqlalchemy.orm import Session

from app.models.classroom import Classroom
from app.models.classroom_member import ClassroomMember



def create_classroom(
    db: Session,
    name: str,
    description: str | None,
    educator_id: int
):
    classroom = Classroom(
        name=name,
        description=description,
        educator_id=educator_id
    )

    db.add(classroom)
    db.commit()
    db.refresh(classroom)

    return classroom


def get_classrooms_by_educator(
    db: Session,
    educator_id: int
):
    return (
        db.query(Classroom)
        .filter(
            Classroom.educator_id == educator_id
        )
        .order_by(
            Classroom.created_at.desc()
        )
        .all()
    )

def get_classroom_by_id_and_educator(
    db: Session,
    classroom_id: int,
    educator_id: int
):
    return (
        db.query(Classroom)
        .filter(
            Classroom.id == classroom_id,
            Classroom.educator_id == educator_id
        )
        .first()
    )


def get_existing_classroom_member(
    db: Session,
    classroom_id: int,
    learner_id: int
):
    return (
        db.query(ClassroomMember)
        .filter(
            ClassroomMember.classroom_id == classroom_id,
            ClassroomMember.learner_id == learner_id
        )
        .first()
    )


def add_learner_to_classroom(
    db: Session,
    classroom_id: int,
    learner_id: int
):
    membership = ClassroomMember(
        classroom_id=classroom_id,
        learner_id=learner_id
    )

    db.add(membership)
    db.commit()
    db.refresh(membership)

    return membership


def get_classroom_members(
    db: Session,
    classroom_id: int
):
    return (
        db.query(ClassroomMember)
        .filter(
            ClassroomMember.classroom_id == classroom_id
        )
        .order_by(
            ClassroomMember.joined_at.desc()
        )
        .all()
    )

def remove_learner_from_classroom(
    db: Session,
    classroom_id: int,
    learner_id: int
):

    membership = (
        db.query(ClassroomMember)
        .filter(
            ClassroomMember.classroom_id == classroom_id,
            ClassroomMember.learner_id == learner_id
        )
        .first()
    )

    if membership is None:
        return False

    db.delete(membership)
    db.commit()

    return True

def get_classrooms_for_learner(
    db: Session,
    learner_id: int
):
    return (
        db.query(Classroom)
        .join(
            ClassroomMember,
            Classroom.id == ClassroomMember.classroom_id
        )
        .filter(
            ClassroomMember.learner_id == learner_id
        )
        .order_by(
            Classroom.created_at.desc()
        )
        .all()
    )

    # ============================================================
# CHECK LEARNER CLASSROOM MEMBERSHIP
# ============================================================

def get_classroom_for_learner(
    db: Session,
    classroom_id: int,
    learner_id: int
):
    return (
        db.query(Classroom)
        .join(
            ClassroomMember,
            Classroom.id == ClassroomMember.classroom_id
        )
        .filter(
            Classroom.id == classroom_id,
            ClassroomMember.learner_id == learner_id
        )
        .first()
    )