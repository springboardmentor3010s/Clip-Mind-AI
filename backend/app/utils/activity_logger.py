from sqlalchemy.orm import Session
from app.models import ActivityLog


def log_activity(
    db: Session,
    user_id: int,
    action: str,
    description: str = ""
):
    activity = ActivityLog(
        user_id=user_id,
        action=action,
        description=description,
    )

    db.add(activity)
    db.commit()