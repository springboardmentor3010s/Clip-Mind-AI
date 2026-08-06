from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.postgres import get_db
from app.models.enrollment import Enrollment

router = APIRouter(
    prefix="/enrollment",
    tags=["Enrollment"]
)


@router.post("/{course_id}")
def enroll(
    course_id: int,
    learner_id: int,
    db: Session = Depends(get_db)
):
    enrollment = Enrollment(
        course_id=course_id,
        learner_id=learner_id
    )

    db.add(enrollment)
    db.commit()

    return {
        "message": "Enrolled Successfully"
    }