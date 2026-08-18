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
        ActivityType.REGISTER:
            "User registered.",

        ActivityType.LOGIN:
            "User logged in.",

        ActivityType.LOGOUT:
            "User logged out.",

        ActivityType.PROFILE_UPDATED:
            "Profile updated.",

        ActivityType.VIDEO_UPLOADED:
            (
                f"Uploaded video '{entity_name}'."
                if entity_name
                else "Uploaded a video."
            ),

        ActivityType.VIDEO_DELETED:
            (
                f"Deleted video '{entity_name}'."
                if entity_name
                else "Deleted a video."
            ),

        ActivityType.TRANSCRIPT_GENERATED:
            (
                f"Generated transcript for '{entity_name}'."
                if entity_name
                else "Generated transcript."
            ),

        ActivityType.TRANSCRIPT_VIEWED:
            (
                f"Viewed transcript for '{entity_name}'."
                if entity_name
                else "Viewed transcript."
            ),

        ActivityType.TRANSCRIPT_SEGMENTS_VIEWED:
            (
                f"Viewed timestamped transcript segments for '{entity_name}'."
                if entity_name
                else "Viewed timestamped transcript segments."
            ),

        ActivityType.SUMMARY_GENERATED:
            (
                f"Generated AI summary for '{entity_name}'."
                if entity_name
                else "Generated AI summary."
            ),

        ActivityType.SUMMARY_VIEWED:
            (
                f"Viewed AI summary for '{entity_name}'."
                if entity_name
                else "Viewed AI summary."
            ),

        ActivityType.KEY_MOMENTS_DETECTED:
            (
                f"Generated key moments for '{entity_name}'."
                if entity_name
                else "Generated key moments."
            ),

        ActivityType.KEY_MOMENTS_VIEWED:
            (
                f"Viewed key moments for '{entity_name}'."
                if entity_name
                else "Viewed key moments."
            ),

        ActivityType.HIGHLIGHT_REPORT_VIEWED:
            (
                f"Generated and viewed highlight report for '{entity_name}'."
                if entity_name
                else "Generated and viewed highlight report."
            ),

        ActivityType.KEYWORDS_GENERATED:
            (
                f"Generated keywords for '{entity_name}'."
                if entity_name
                else "Generated keywords."
            ),

        ActivityType.KEYWORDS_VIEWED:
            (
                f"Viewed keywords for '{entity_name}'."
                if entity_name
                else "Viewed keywords."
            ),

        ActivityType.BOOKMARK_ADDED:
            "Bookmarked summary.",

        ActivityType.SUMMARY_DOWNLOADED:
            "Downloaded summary.",
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