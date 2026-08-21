import random
import string

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Classroom, ClassroomMember, Video
from app.utils.role_guard import require_roles

router = APIRouter(
    prefix="/classrooms",
    tags=["Classrooms"]
)


# =========================================================
# REQUEST MODELS
# =========================================================

class CreateClassroomRequest(BaseModel):
    name: str


class JoinClassroomRequest(BaseModel):
    code: str


# =========================================================
# CLASSROOM CODE GENERATOR
# =========================================================

def generate_classroom_code():
    return "".join(
        random.choices(
            string.ascii_uppercase + string.digits,
            k=6
        )
    )


# =========================================================
# CREATE CLASSROOM
# =========================================================

@router.post("/create")
def create_classroom(
    data: CreateClassroomRequest,
    current_user: User = Depends(
        require_roles("educator")
    ),
    db: Session = Depends(get_db),
):
    name = data.name.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Classroom name cannot be empty."
        )

    # Generate a unique classroom code
    while True:
        code = generate_classroom_code()

        existing = (
            db.query(Classroom)
            .filter(Classroom.code == code)
            .first()
        )

        if not existing:
            break

    classroom = Classroom(
        name=name,
        code=code,
        created_by=current_user.id
    )

    db.add(classroom)
    db.commit()
    db.refresh(classroom)

    return {
        "message": "Classroom created successfully.",
        "classroom": {
            "id": classroom.id,
            "name": classroom.name,
            "code": classroom.code,
            "created_by": classroom.created_by,
        }
    }


# =========================================================
# GET EDUCATOR'S CLASSROOMS
# =========================================================

@router.get("/my-classrooms")
def get_my_classrooms(
    current_user: User = Depends(
        require_roles("educator")
    ),
    db: Session = Depends(get_db),
):
    classrooms = (
        db.query(Classroom)
        .filter(
            Classroom.created_by == current_user.id
        )
        .order_by(Classroom.id.desc())
        .all()
    )

    result = []

    for classroom in classrooms:

        student_count = (
            db.query(ClassroomMember)
            .filter(
                ClassroomMember.classroom_id == classroom.id
            )
            .count()
        )

        result.append({
            "id": classroom.id,
            "name": classroom.name,
            "code": classroom.code,
            "student_count": student_count,
        })

    return result


# =========================================================
# JOIN CLASSROOM
# =========================================================

@router.post("/join")
def join_classroom(
    data: JoinClassroomRequest,
    current_user: User = Depends(
        require_roles("learner")
    ),
    db: Session = Depends(get_db),
):
    code = data.code.strip().upper()

    if not code:
        raise HTTPException(
            status_code=400,
            detail="Classroom code cannot be empty."
        )

    classroom = (
        db.query(Classroom)
        .filter(
            Classroom.code == code
        )
        .first()
    )

    if classroom is None:
        raise HTTPException(
            status_code=404,
            detail="Classroom not found."
        )

    # Check whether learner has already joined
    existing_member = (
        db.query(ClassroomMember)
        .filter(
            ClassroomMember.classroom_id == classroom.id,
            ClassroomMember.student_id == current_user.id
        )
        .first()
    )

    if existing_member:
        raise HTTPException(
            status_code=400,
            detail="You have already joined this classroom."
        )

    member = ClassroomMember(
        classroom_id=classroom.id,
        student_id=current_user.id
    )

    db.add(member)
    db.commit()

    return {
        "message": "Joined classroom successfully.",
        "classroom": {
            "id": classroom.id,
            "name": classroom.name,
            "code": classroom.code,
        }
    }


# =========================================================
# GET LEARNER'S JOINED CLASSROOMS
# =========================================================

@router.get("/my-joined-classrooms")
def get_my_joined_classrooms(
    current_user: User = Depends(
        require_roles("learner")
    ),
    db: Session = Depends(get_db),
):
    classrooms = (
        db.query(Classroom)
        .join(
            ClassroomMember,
            ClassroomMember.classroom_id == Classroom.id
        )
        .filter(
            ClassroomMember.student_id == current_user.id
        )
        .order_by(Classroom.id.desc())
        .all()
    )

    return [
        {
            "id": classroom.id,
            "name": classroom.name,
            "code": classroom.code,
        }
        for classroom in classrooms
    ]
# -----------------------------------------
# GET VIDEOS IN CLASSROOM
# -----------------------------------------

@router.get("/{classroom_id}/videos")
def get_classroom_videos(
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

    # -----------------------------------------
    # EDUCATOR ACCESS
    # -----------------------------------------

    if current_user.role == "educator":

        if classroom.created_by != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can only access your own classrooms."
            )

    # -----------------------------------------
    # LEARNER ACCESS
    # -----------------------------------------

    elif current_user.role == "learner":

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
                detail="You are not a member of this classroom."
            )

    # -----------------------------------------
    # GET CLASSROOM VIDEOS
    # -----------------------------------------

    videos = (
        db.query(Video)
        .filter(
            Video.classroom_id == classroom_id
        )
        .order_by(Video.id.desc())
        .all()
    )

    return [
        {
            "id": video.id,
            "filename": video.filename,
            "original_filename": video.original_filename,
            "status": video.status,
            "classroom_id": video.classroom_id,
            "transcript_available": bool(video.transcript),
            "summary_available": bool(video.summary),
        }
        for video in videos
    ]

# =========================================================
# GET STUDENTS IN CLASSROOM
# =========================================================

@router.get("/{classroom_id}/students")
def get_classroom_students(
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

    # EDUCATOR ACCESS
    if current_user.role == "educator":

        if classroom.created_by != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can only view students in your own classrooms."
            )

    # LEARNER ACCESS
    elif current_user.role == "learner":

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
                detail="You are not a member of this classroom."
            )

    members = (
        db.query(ClassroomMember)
        .filter(
            ClassroomMember.classroom_id == classroom_id
        )
        .all()
    )

    return [
        {
            "id": member.student.id,
            "username": member.student.username,
            "email": member.student.email,
        }
        for member in members
    ]