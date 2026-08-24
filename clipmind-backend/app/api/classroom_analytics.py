from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.auth.authorization import require_roles
from app.core.enums import UserRole

from app.schemas.classroom_analytics import (
    ClassroomAnalyticsResponse
)

from app.services.classroom_analytics_service import (
    generate_classroom_analytics
)


router = APIRouter(
    prefix="/classroom-analytics",
    tags=["Classroom Analytics"]
)


@router.get(
    "",
    response_model=ClassroomAnalyticsResponse
)
def get_classroom_analytics(
    current_user=Depends(
        require_roles(UserRole.EDUCATOR)
    ),
    db: Session = Depends(get_db)
):

    return generate_classroom_analytics(
        db=db,
        educator_id=current_user.id
    )