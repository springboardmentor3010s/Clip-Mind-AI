from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from models.database import get_db
from models.db_models import ActivityLog, User
from routes.auth import get_current_user

router = APIRouter(tags=["activity"])


@router.get("/activity")
def get_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ActivityLog)

    # Administrators can view all activity.
    # Other users can only view their own activity.
    if current_user.role != "Administrator":
        query = query.filter(
            ActivityLog.user_id == current_user.id
        )

    activities = (
        query
        .order_by(ActivityLog.created_at.desc())
        .all()
    )

    return [activity.to_record() for activity in activities]