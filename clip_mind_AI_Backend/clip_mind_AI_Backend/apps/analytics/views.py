"""
Analytics endpoints (Module 6).

Four distinct surfaces, each scoped to the role that needs it:

  /analytics/            personal metrics — every role
  /analytics/content     content insights — Content Creator / Educator
  /analytics/classroom   classroom + student engagement — Educator
  (system analytics live under /api/v1/admin/stats — see apps.accounts.admin_views)
"""
import json
from datetime import timedelta

from django.db.models import Sum, Count, Q, Avg
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from core.responses import success_response
from core.permissions import IsEducator, CanEditTranscript
from apps.videos.models import Video, VideoView, Bookmark, LearningHistory
from apps.transcripts.models import Transcript
from apps.summaries.models import Summary


def _daily_series(queryset, date_field="created_at", days=14):
    """
    Dense day-by-day counts for the last `days` days.

    Gaps are filled with zeros so the frontend chart has a continuous x-axis
    rather than skipping quiet days.
    """
    since = timezone.now() - timedelta(days=days)
    rows = (
        queryset.filter(**{f"{date_field}__gte": since})
        .annotate(date=TruncDate(date_field))
        .values("date")
        .annotate(count=Count("id"))
        .order_by("date")
    )
    counts = {r["date"].strftime("%Y-%m-%d"): r["count"] for r in rows if r["date"]}

    today = timezone.now().date()
    series = []
    for i in range(days - 1, -1, -1):
        day = (today - timedelta(days=i)).strftime("%Y-%m-%d")
        series.append({"date": day, "count": counts.get(day, 0)})
    return series


class AnalyticsView(APIView):
    """GET /api/v1/analytics — personal metrics for the signed-in user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        user_videos = Video.objects.filter(user=user)

        total_videos = user_videos.count()
        completed_count = user_videos.filter(status=Video.Status.COMPLETED).count()
        failed_count = user_videos.filter(status=Video.Status.FAILED).count()
        processing_count = user_videos.filter(
            status__in=[Video.Status.PENDING, Video.Status.PROCESSING]
        ).count()

        total_summaries = Summary.objects.filter(video__user=user).count()
        total_words = Transcript.objects.filter(video__user=user).aggregate(
            s=Sum("word_count")
        )["s"] or 0

        storage_bytes = sum(
            (v.video_file.size for v in user_videos if v.video_file and v.video_file.name and _safe_size(v)),
            0,
        )
        total_duration = user_videos.aggregate(d=Sum("duration_seconds"))["d"] or 0.0

        history_rows = (
            user_videos.annotate(date=TruncDate("created_at"))
            .values("date").annotate(count=Count("id")).order_by("date")
        )
        history = [
            {"date": r["date"].strftime("%Y-%m-%d"), "count": r["count"]}
            for r in history_rows if r["date"]
        ]

        return success_response("Analytics data retrieved.", data={
            "role": user.role,
            "total_videos": total_videos,
            "completed_count": completed_count,
            "failed_count": failed_count,
            "processing_count": processing_count,
            "total_summaries": total_summaries,
            "total_words": total_words,
            "storage_bytes": storage_bytes,
            "storage_mb": round(storage_bytes / (1024 * 1024), 2),
            "total_duration_seconds": round(total_duration, 1),
            "avg_duration_seconds": round(total_duration / total_videos, 1) if total_videos else 0,
            # Learner-oriented counters (0 for pure creators, and vice versa).
            "bookmarks_count": Bookmark.objects.filter(user=user).count(),
            "history_count": LearningHistory.objects.filter(user=user).count(),
            "videos_watched": LearningHistory.objects.filter(user=user).count(),
            "completed_watched": LearningHistory.objects.filter(user=user, completed=True).count(),
            "history": history,
            "daily_uploads": _daily_series(user_videos),
        })


def _safe_size(video) -> bool:
    """Guard against files removed from disk outside Django."""
    try:
        return video.video_file.size >= 0
    except (OSError, ValueError):
        return False


class ContentInsightsView(APIView):
    """
    GET /api/v1/analytics/content — content insights for creators/educators
    ("View content analytics", "Content insights").
    """

    permission_classes = [IsAuthenticated, CanEditTranscript]

    def get(self, request):
        user = request.user
        videos = (
            Video.objects.filter(user=user, status=Video.Status.COMPLETED)
            .select_related("summary", "transcript")
            .prefetch_related("key_moments")
        )

        # Aggregate the AI-extracted topics into a platform-style keyword cloud.
        topic_counts = {}
        total_key_moments = 0
        for video in videos:
            total_key_moments += len(video.key_moments.all())
            summary = getattr(video, "summary", None)
            if not summary:
                continue
            try:
                sections = json.loads(summary.content)
            except (ValueError, TypeError):
                continue
            for topic in sections.get("important_topics", []) or []:
                if isinstance(topic, str) and topic.strip():
                    key = topic.strip().lower()
                    topic_counts[key] = topic_counts.get(key, 0) + 1

        top_topics = sorted(
            ({"topic": k, "count": v} for k, v in topic_counts.items()),
            key=lambda x: x["count"], reverse=True,
        )[:20]

        # Per-video engagement for the creator's own content.
        per_video = []
        for video in videos:
            views = VideoView.objects.filter(video=video)
            per_video.append({
                "video_id": str(video.id),
                "title": video.title,
                "duration_seconds": video.duration_seconds,
                "views": views.count(),
                "unique_viewers": views.values("user").distinct().count(),
                "bookmarks": Bookmark.objects.filter(video=video).count(),
                "key_moments": len(video.key_moments.all()),
                "word_count": getattr(video.transcript, "word_count", 0) if hasattr(video, "transcript") else 0,
                "is_shared": hasattr(video, "share"),
            })
        per_video.sort(key=lambda v: v["views"], reverse=True)

        return success_response("Content insights retrieved.", data={
            "total_published": videos.count(),
            "total_key_moments": total_key_moments,
            "total_views": sum(v["views"] for v in per_video),
            "total_bookmarks": sum(v["bookmarks"] for v in per_video),
            "shared_count": sum(1 for v in per_video if v["is_shared"]),
            "top_topics": top_topics,
            "top_videos": per_video[:10],
            "per_video": per_video,
        })


class ClassroomAnalyticsView(APIView):
    """
    GET /api/v1/analytics/classroom — Educator classroom analytics and
    student engagement metrics.
    """

    permission_classes = [IsAuthenticated, IsEducator]

    def get(self, request):
        user = request.user
        videos = (
            Video.objects.filter(user=user)
            .select_related("summary")
            .prefetch_related("key_moments")
        )
        video_ids = list(videos.values_list("id", flat=True))

        views = VideoView.objects.filter(video_id__in=video_ids).exclude(user=user)
        histories = LearningHistory.objects.filter(video_id__in=video_ids).exclude(user=user)

        total_views = views.count()
        unique_students = views.values("user").distinct().count()

        # Per-video engagement table.
        per_video = []
        for video in videos:
            v_views = views.filter(video=video)
            v_hist = histories.filter(video=video)
            per_video.append({
                "video_id": str(video.id),
                "title": video.title,
                "views": v_views.count(),
                "unique_students": v_views.values("user").distinct().count(),
                "completed_count": v_hist.filter(completed=True).count(),
                "avg_watch_seconds": round(v_views.aggregate(a=Avg("watch_seconds"))["a"] or 0.0, 1),
                "duration_seconds": video.duration_seconds,
                "is_shared": hasattr(video, "share"),
            })
        per_video.sort(key=lambda v: v["views"], reverse=True)

        # Individual student engagement.
        students = []
        for row in (
            histories.values("user__id", "user__email", "user__first_name", "user__last_name")
            .annotate(
                videos_watched=Count("video", distinct=True),
                total_views=Sum("view_count"),
                completed=Count("id", filter=Q(completed=True)),
            )
            .order_by("-total_views")
        ):
            name = f"{row['user__first_name']} {row['user__last_name']}".strip()
            students.append({
                "user_id": str(row["user__id"]),
                "name": name or row["user__email"],
                "email": row["user__email"],
                "videos_watched": row["videos_watched"],
                "total_views": row["total_views"] or 0,
                "completed": row["completed"],
            })

        return success_response("Classroom analytics retrieved.", data={
            "total_videos": videos.count(),
            "shared_videos": sum(1 for v in per_video if v["is_shared"]),
            "total_student_views": total_views,
            "unique_students": unique_students,
            "avg_views_per_video": round(total_views / len(video_ids), 1) if video_ids else 0,
            "completion_count": histories.filter(completed=True).count(),
            "top_video": per_video[0] if per_video else None,
            "per_video": per_video,
            "students": students,
            "engagement_series": _daily_series(views, days=14),
        })
