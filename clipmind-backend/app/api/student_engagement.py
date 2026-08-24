from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from app.database.connection import get_db

from app.auth.authorization import require_roles

from app.core.enums import UserRole

from app.schemas.student_engagement import (
    StudentEngagementResponse
)

from app.services.student_engagement_service import (
    generate_student_engagement
)


router = APIRouter(
    prefix="/student-engagement",
    tags=["Student Engagement"]
)


@router.get(
    "",
    response_model=StudentEngagementResponse
)
def get_student_engagement(
    current_user=Depends(
        require_roles(UserRole.EDUCATOR)
    ),
    db: Session = Depends(get_db)
):

    return generate_student_engagement(
        db=db,
        educator_id=current_user.id
    )