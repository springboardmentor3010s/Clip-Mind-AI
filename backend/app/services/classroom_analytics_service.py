"""
Classroom Analytics — the PRD's "classroom content analytics" and
"student engagement metrics" features. Scopes the existing per-video
watch-tracking data (video_views_collection in Mongo, owned by
video_analytics_service) down to one classroom: only the videos shared
with it, and only the engagement of students enrolled in it.
"""
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.mongo import video_views_collection
from app.models.classroom import Classroom
from app.models.classroom_membership import ClassroomMembership
from app.models.classroom_video_share import ClassroomVideoShare
from app.models.user import User
from app.models.video import Video


async def get_classroom_analytics(db: Session, classroom_id: uuid.UUID, educator: User) -> dict:
    """Educator-only (must own the classroom): engagement across every video shared with it."""
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found.")
    if classroom.educator_id != educator.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the classroom's educator can view this.")

    roster = (
        db.query(ClassroomMembership, User)
        .join(User, User.id == ClassroomMembership.student_id)
        .filter(ClassroomMembership.classroom_id == classroom_id)
        .all()
    )
    student_ids = {str(user.id) for _membership, user in roster}
    student_count = len(roster)

    shares = (
        db.query(ClassroomVideoShare, Video)
        .join(Video, Video.id == ClassroomVideoShare.video_id)
        .filter(ClassroomVideoShare.classroom_id == classroom_id)
        .order_by(ClassroomVideoShare.created_at.desc())
        .all()
    )
    video_count = len(shares)

    # video_id -> per-student engagement, per-student -> per-video engagement — built together
    # in one pass over Mongo so we only query video_views once per video.
    per_video: list[dict] = []
    per_student_watch: dict[str, list[dict]] = {sid: [] for sid in student_ids}
    all_pair_completions: list[float] = []

    for share, video in shares:
        duration = video.duration_seconds or 0
        docs = [
            doc
            async for doc in video_views_collection.find({"video_id": str(video.id)})
            if doc.get("viewer_id") in student_ids
        ]

        completions = []
        watch_times = []
        for doc in docs:
            watched = doc.get("watched_seconds", 0)
            completion_pct = min(watched / duration, 1.0) * 100 if duration else 0.0
            completions.append(completion_pct)
            watch_times.append(watched)
            all_pair_completions.append(completion_pct)

            per_student_watch[doc["viewer_id"]].append(
                {
                    "completion_pct": completion_pct,
                    "watched_seconds": watched,
                    "last_watched_at": doc.get("last_watched_at"),
                }
            )

        students_watched = len(docs)
        per_video.append(
            {
                "video_id": video.id,
                "title": video.title or video.filename,
                "shared_at": share.created_at,
                "students_watched": students_watched,
                "student_count": student_count,
                "watch_rate_pct": round((students_watched / student_count * 100) if student_count else 0.0, 1),
                "avg_completion_pct": round(sum(completions) / len(completions), 1) if completions else 0.0,
                "avg_watch_time_seconds": round(sum(watch_times) / len(watch_times), 1) if watch_times else 0.0,
            }
        )

    students_out = []
    for _membership, user in roster:
        watches = per_student_watch.get(str(user.id), [])
        last_active = max((w["last_watched_at"] for w in watches if w["last_watched_at"]), default=None)
        students_out.append(
            {
                "student_id": user.id,
                "full_name": user.full_name,
                "videos_watched": len(watches),
                "videos_assigned": video_count,
                "avg_completion_pct": round(sum(w["completion_pct"] for w in watches) / len(watches), 1) if watches else 0.0,
                "total_watch_time_seconds": round(sum(w["watched_seconds"] for w in watches), 1),
                "last_active_at": last_active,
            }
        )
    students_out.sort(key=lambda s: s["total_watch_time_seconds"], reverse=True)

    avg_completion_pct = round(sum(all_pair_completions) / len(all_pair_completions), 1) if all_pair_completions else 0.0

    return {
        "classroom_id": classroom.id,
        "classroom_name": classroom.name,
        "student_count": student_count,
        "video_count": video_count,
        "avg_completion_pct": avg_completion_pct,
        "videos": per_video,
        "students": students_out,
        "generated_at": datetime.now(timezone.utc),
    }