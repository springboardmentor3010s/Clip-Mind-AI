from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.auth.oauth2 import get_current_user

from app.schemas.usage_analytics import (
    UsageAnalyticsResponse
)

from app.services.usage_analytics_service import (
    generate_usage_analytics
)


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


@router.get(
    "/usage",
    response_model=UsageAnalyticsResponse
)
def get_usage_analytics(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    analytics = generate_usage_analytics(
        db=db,
        owner_id=current_user.id
    )

    return analytics