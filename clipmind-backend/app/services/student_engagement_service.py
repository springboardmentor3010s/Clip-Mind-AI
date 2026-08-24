from sqlalchemy.orm import Session

from app.models.activity_history import ActivityHistory
from app.models.classroom import Classroom
from app.models.classroom_member import ClassroomMember
from app.models.user import User

from app.core.enums import ActivityType


ENGAGEMENT_ACTIVITY_TYPES = [
    ActivityType.TRANSCRIPT_VIEWED.value,
    ActivityType.TRANSCRIPT_SEGMENTS_VIEWED.value,
    ActivityType.SUMMARY_VIEWED.value,
    ActivityType.KEY_MOMENTS_VIEWED.value,
    ActivityType.HIGHLIGHT_REPORT_VIEWED.value,
    ActivityType.BOOKMARK_ADDED.value,
]


def generate_student_engagement(
    db: Session,
    educator_id: int
):

    # ============================================================
    # 1. GET EDUCATOR'S CLASSROOMS
    # ============================================================

    classrooms = (
        db.query(Classroom)
        .filter(
            Classroom.educator_id == educator_id
        )
        .all()
    )

    classroom_ids = [
        classroom.id
        for classroom in classrooms
    ]

    if not classroom_ids:
        return {
            "total_learners": 0,
            "active_learners": 0,
            "inactive_learners": 0,
            "total_engagement_actions": 0,
            "summary_views": 0,
            "transcript_views": 0,
            "transcript_segment_views": 0,
            "key_moment_views": 0,
            "highlight_views": 0,
            "bookmarks_added": 0,
            "average_actions_per_active_learner": 0.0,
            "students": [],
        }


    # ============================================================
    # 2. GET LEARNERS FROM THOSE CLASSROOMS
    # ============================================================

    learner_ids = [
        row[0]
        for row in (
            db.query(
                ClassroomMember.learner_id
            )
            .filter(
                ClassroomMember.classroom_id.in_(
                    classroom_ids
                )
            )
            .distinct()
            .all()
        )
    ]

    if not learner_ids:
        return {
            "total_learners": 0,
            "active_learners": 0,
            "inactive_learners": 0,
            "total_engagement_actions": 0,
            "summary_views": 0,
            "transcript_views": 0,
            "transcript_segment_views": 0,
            "key_moment_views": 0,
            "highlight_views": 0,
            "bookmarks_added": 0,
            "average_actions_per_active_learner": 0.0,
            "students": [],
        }


    # ============================================================
    # 3. GET LEARNER USERS
    # ============================================================

    learners = (
        db.query(User)
        .filter(
            User.id.in_(learner_ids)
        )
        .all()
    )

    learner_map = {
        learner.id: learner
        for learner in learners
    }


    # ============================================================
    # 4. GET ENGAGEMENT ACTIVITIES
    # ============================================================

    activities = (
        db.query(ActivityHistory)
        .filter(
            ActivityHistory.user_id.in_(
                learner_ids
            ),
            ActivityHistory.activity_type.in_(
                ENGAGEMENT_ACTIVITY_TYPES
            )
        )
        .order_by(
            ActivityHistory.created_at.desc()
        )
        .all()
    )


    # ============================================================
    # 5. INITIALIZE STUDENT METRICS
    # ============================================================

    student_metrics = {}

    for learner_id in learner_ids:

        learner = learner_map.get(learner_id)

        student_metrics[learner_id] = {
            "learner_id": learner_id,
            "full_name": (
                learner.full_name
                if learner
                else "Unknown Learner"
            ),
            "username": (
                learner.username
                if learner
                else ""
            ),

            "total_actions": 0,

            "summary_views": 0,
            "transcript_views": 0,
            "transcript_segment_views": 0,
            "key_moment_views": 0,
            "highlight_views": 0,
            "bookmarks_added": 0,

            "last_active_at": None,
        }


    # ============================================================
    # 6. CALCULATE ENGAGEMENT
    # ============================================================

    for activity in activities:

        metrics = student_metrics.get(
            activity.user_id
        )

        if metrics is None:
            continue

        metrics["total_actions"] += 1

        activity_type = (
            activity.activity_type
        )

        if activity_type == (
            ActivityType.SUMMARY_VIEWED.value
        ):
            metrics["summary_views"] += 1

        elif activity_type == (
            ActivityType.TRANSCRIPT_VIEWED.value
        ):
            metrics["transcript_views"] += 1

        elif activity_type == (
            ActivityType.TRANSCRIPT_SEGMENTS_VIEWED.value
        ):
            metrics[
                "transcript_segment_views"
            ] += 1

        elif activity_type == (
            ActivityType.KEY_MOMENTS_VIEWED.value
        ):
            metrics["key_moment_views"] += 1

        elif activity_type == (
            ActivityType.HIGHLIGHT_REPORT_VIEWED.value
        ):
            metrics["highlight_views"] += 1

        elif activity_type == (
            ActivityType.BOOKMARK_ADDED.value
        ):
            metrics["bookmarks_added"] += 1


        if (
            metrics["last_active_at"] is None
            or activity.created_at >
               metrics["last_active_at"]
        ):
            metrics["last_active_at"] = (
                activity.created_at
            )


    # ============================================================
    # 7. CALCULATE OVERALL METRICS
    # ============================================================

    students = list(
        student_metrics.values()
    )

    total_learners = len(
        students
    )

    active_learners = sum(
        1
        for student in students
        if student["total_actions"] > 0
    )

    inactive_learners = (
        total_learners -
        active_learners
    )

    total_engagement_actions = sum(
        student["total_actions"]
        for student in students
    )

    summary_views = sum(
        student["summary_views"]
        for student in students
    )

    transcript_views = sum(
        student["transcript_views"]
        for student in students
    )

    transcript_segment_views = sum(
        student["transcript_segment_views"]
        for student in students
    )

    key_moment_views = sum(
        student["key_moment_views"]
        for student in students
    )

    highlight_views = sum(
        student["highlight_views"]
        for student in students
    )

    bookmarks_added = sum(
        student["bookmarks_added"]
        for student in students
    )


    if active_learners > 0:

        average_actions = (
            total_engagement_actions /
            active_learners
        )

    else:

        average_actions = 0.0


    # ============================================================
    # 8. ADD ENGAGEMENT STATUS
    # ============================================================

    for student in students:

        if student["total_actions"] > 0:

            student["engagement_status"] = "ACTIVE"

        else:

            student["engagement_status"] = "INACTIVE"


    # ============================================================
    # 9. SORT MOST ENGAGED FIRST
    # ============================================================

    students.sort(
        key=lambda student:
            student["total_actions"],
        reverse=True
    )


    return {
        "total_learners":
            total_learners,

        "active_learners":
            active_learners,

        "inactive_learners":
            inactive_learners,

        "total_engagement_actions":
            total_engagement_actions,

        "summary_views":
            summary_views,

        "transcript_views":
            transcript_views,

        "transcript_segment_views":
            transcript_segment_views,

        "key_moment_views":
            key_moment_views,

        "highlight_views":
            highlight_views,

        "bookmarks_added":
            bookmarks_added,

        "average_actions_per_active_learner":
            round(
                average_actions,
                2
            ),

        "students":
            students,
    }