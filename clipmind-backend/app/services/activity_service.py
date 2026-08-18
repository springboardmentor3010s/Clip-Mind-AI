from sqlalchemy.orm import Session

from app.models.user import User
from app.core.enums import ActivityType
from app.crud.activity_history import create_activity


def log_activity(
    db: Session,
    user: User,
    activity_type: ActivityType,
    entity_name: str = None
):

    descriptions = {
    ActivityType.REGISTER: "User registered.",
    ActivityType.LOGIN: "User logged in.",
    ActivityType.LOGOUT: "User logged out.",

    ActivityType.PROFILE_UPDATED: "Profile updated.",

    ActivityType.VIDEO_UPLOADED: (
        f"Uploaded video '{entity_name}'."
        if entity_name else
        "Uploaded a video."
    ),

    ActivityType.VIDEO_DELETED: (
        f"Deleted video '{entity_name}'."
        if entity_name else
        "Deleted a video."
    ),

    ActivityType.TRANSCRIPT_GENERATED:
        "Generated transcript.",

    ActivityType.TRANSCRIPT_VIEWED:
        "Viewed transcript.",

    ActivityType.TRANSCRIPT_DOWNLOADED:
        "Downloaded transcript.",

    ActivityType.TRANSCRIPT_SEGMENTS_VIEWED:
        "Viewed transcript segments.",

    ActivityType.SUMMARY_GENERATED:
        "Generated AI summary.",

    ActivityType.SUMMARY_VIEWED:
        "Viewed AI summary.",

    ActivityType.SUMMARY_DOWNLOADED:
        "Downloaded AI summary.",

    ActivityType.KEY_MOMENTS_DETECTED:
        "Detected key moments.",

    ActivityType.BOOKMARK_ADDED:
        "Bookmarked summary.",
}

    description = descriptions.get(
        activity_type,
        "Performed an activity."
    )

    return create_activity(
        db=db,
        user=user,
        activity_type=activity_type,
        description=description
    )