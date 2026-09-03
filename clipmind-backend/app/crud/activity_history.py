from sqlalchemy.orm import Session

from app.models.activity_history import ActivityHistory
from app.models.user import User
from app.core.enums import ActivityType


def create_activity(
    db: Session,
    user: User,
    activity_type: ActivityType,
    description: str
):

    activity = ActivityHistory(
        user_id=user.id,
        activity_type=activity_type.value,
        description=description
    )

    db.add(activity)
    db.commit()
    db.refresh(activity)

    return activity

def get_user_activities(
    db: Session,
    user: User
):

    return (
        db.query(ActivityHistory)
        .filter(
            ActivityHistory.user_id == user.id
        )
        .order_by(
            ActivityHistory.created_at.desc()
        )
        .all()
    )

def get_all_activities(
    db: Session
):
    return (
        db.query(ActivityHistory)
        .order_by(
            ActivityHistory.created_at.desc()
        )
        .all()
    )