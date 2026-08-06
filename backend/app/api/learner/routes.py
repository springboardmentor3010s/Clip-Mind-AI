from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.postgres import get_db

from app.models.course import Course

router = APIRouter(
    prefix="/learner",
    tags=["Learner"]
)


@router.get("/courses")
def get_courses(
    db: Session = Depends(get_db)
):

    courses = db.query(Course).all()

    data = []

    for course in courses:

        data.append({

            "id": course.id,

            "title": course.title,

            "description": course.description

        })

    return data