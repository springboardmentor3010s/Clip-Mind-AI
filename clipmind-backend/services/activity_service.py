import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from models.db_models import ActivityLog


# Activity types
REGISTER = "register"
LOGIN = "login"
VIDEO_UPLOAD = "video_upload"
VIDEO_DELETE = "video_delete"
TRANSCRIPT_GENERATED = "transcript_generated"
TRANSCRIPT_UPDATED = "transcript_updated"
SUMMARY_GENERATED = "summary_generated"
MOMENTS_GENERATED = "moments_generated"
ANALYTICS_GENERATED = "analytics_generated"
PROFILE_UPDATED = "profile_updated"


def log(
    db: Session,
    user_id: str,
    action: str,
    video_id: str | None = None,
    details: str | None = None,
) -> ActivityLog:
    activity = ActivityLog(
        id=str(uuid.uuid4()),
        user_id=user_id,
        action=action,
        video_id=video_id,
        details=details,
        created_at=datetime.now(timezone.utc).isoformat(),
    )

    db.add(activity)
    db.commit()
    db.refresh(activity)

    return activity