"""
Administrator module — every endpoint here requires the `admin` role.

Covers the eight Administrator capabilities from the specification:
  manage users and roles, monitor platform activity, manage uploaded content,
  view system analytics, configure platform settings, monitor AI processing
  jobs, manage storage/resource utilisation, access audit logs and reports.
"""
import logging
import os
from datetime import timedelta

from django.conf import settings
from django.db.models import Count, Sum, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser

from core.responses import success_response, error_response
from core.permissions import IsAdmin
from core.pagination import StandardPagination
from core.logging_service import record_audit

from apps.accounts.models import (
    User, ActivityLog, AuditLog, PlatformSetting, ContactMessage,
)
from apps.accounts.serializers import (
    AdminUserSerializer, AdminUserUpdateSerializer,
    ActivityLogSerializer, AuditLogSerializer, PlatformSettingSerializer,
    ContactMessageSerializer,
)
from apps.videos.models import Video, VideoView, Bookmark
from apps.videos.serializers import VideoListSerializer
from apps.transcripts.models import Transcript
from apps.summaries.models import Summary

logger = logging.getLogger("api")


def _paginate(request, queryset, serializer_class, context=None):
    paginator = StandardPagination()
    page = paginator.paginate_queryset(queryset, request)
    data = serializer_class(page, many=True, context=context or {}).data
    return {
        "results": data,
        "count": paginator.page.paginator.count,
        "page": paginator.page.number,
        "num_pages": paginator.page.paginator.num_pages,
    }


def _video_size(video) -> int:
    """File size in bytes, tolerant of files removed from disk."""
    try:
        if video.video_file and video.video_file.name:
            return video.video_file.size
    except (OSError, ValueError):
        pass
    return 0


class AdminStatsView(APIView):
    """GET /api/v1/admin/stats — system-wide analytics for the admin dashboard."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        videos = Video.objects.all()
        total_storage = sum(_video_size(v) for v in videos.only("video_file"))

        by_role = {
            row["role"]: row["n"]
            for row in User.objects.values("role").annotate(n=Count("id"))
        }
        by_status = {
            row["status"]: row["n"]
            for row in videos.values("status").annotate(n=Count("id"))
        }

        week_ago = timezone.now() - timedelta(days=7)

        return success_response("System statistics retrieved.", data={
            "total_users": User.objects.count(),
            "active_users": User.objects.filter(is_active=True).count(),
            "administrators": User.objects.filter(role=User.Role.ADMIN).count(),
            "users_by_role": by_role,
            "total_videos": videos.count(),
            "videos_by_status": by_status,
            "total_transcripts": Transcript.objects.count(),
            "total_summaries": Summary.objects.count(),
            "total_views": VideoView.objects.count(),
            "total_bookmarks": Bookmark.objects.count(),
            "storage_bytes": total_storage,
            "storage_mb": round(total_storage / (1024 * 1024), 2),
            "new_users_7d": User.objects.filter(created_at__gte=week_ago).count(),
            "new_videos_7d": videos.filter(created_at__gte=week_ago).count(),
            "total_words": Transcript.objects.aggregate(s=Sum("word_count"))["s"] or 0,
        })


class AdminUserListView(APIView):
    """GET /api/v1/admin/users — list/search every account."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        qs = User.objects.annotate(video_count=Count("videos")).order_by("-created_at")

        search = (request.query_params.get("search") or "").strip()
        if search:
            qs = qs.filter(
                Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
            )
        role = (request.query_params.get("role") or "").strip()
        if role:
            qs = qs.filter(role=role)

        users = list(qs)
        # Per-user storage is computed in Python because file sizes live on disk,
        # not in the database.
        sizes = {}
        for video in Video.objects.only("user_id", "video_file"):
            sizes[video.user_id] = sizes.get(video.user_id, 0) + _video_size(video)
        for user in users:
            user.storage_bytes = sizes.get(user.id, 0)

        return success_response("Users retrieved.", data=AdminUserSerializer(users, many=True).data)


class AdminUserDetailView(APIView):
    """
    PATCH  /api/v1/admin/users/<id> — change role / activate / deactivate
    DELETE /api/v1/admin/users/<id> — remove an account
    """

    permission_classes = [IsAuthenticated, IsAdmin]
    parser_classes = [JSONParser]

    def patch(self, request, pk):
        user = User.objects.filter(pk=pk).first()
        if not user:
            return error_response("User not found.", http_status=status.HTTP_404_NOT_FOUND)

        # Guard against an admin locking themselves out of the platform.
        if user.id == request.user.id:
            if request.data.get("is_active") is False:
                return error_response("You cannot deactivate your own account.")
            if request.data.get("role") and request.data["role"] != User.Role.ADMIN:
                return error_response("You cannot demote your own administrator account.")

        serializer = AdminUserUpdateSerializer(user, data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response("Invalid update.", errors=serializer.errors)

        before = {"role": user.role, "is_active": user.is_active}
        serializer.save()
        user.refresh_from_db()

        record_audit(
            request.user, "user.update", target_type="user", target_id=user.id,
            detail=f"{before} -> {{'role': '{user.role}', 'is_active': {user.is_active}}}",
            request=request,
        )
        logger.info("Admin updated user | admin=%s | user=%s", request.user.id, user.id)
        return success_response("User updated.", data=AdminUserSerializer(user).data)

    def delete(self, request, pk):
        user = User.objects.filter(pk=pk).first()
        if not user:
            return error_response("User not found.", http_status=status.HTTP_404_NOT_FOUND)
        if user.id == request.user.id:
            return error_response("You cannot delete your own account.")

        email = user.email
        user.delete()
        record_audit(
            request.user, "user.delete", target_type="user", target_id=pk,
            detail=f"Deleted account {email}", request=request,
        )
        return success_response("User deleted.")


class AdminActivityView(APIView):
    """GET /api/v1/admin/activity — recent platform-wide user activity."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        qs = ActivityLog.objects.select_related("user").all()
        action = (request.query_params.get("action") or "").strip()
        if action:
            qs = qs.filter(action=action)
        return success_response("Activity retrieved.", data=_paginate(request, qs, ActivityLogSerializer))


class AdminContentView(APIView):
    """GET /api/v1/admin/content — every uploaded video, for content management."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        qs = (
            Video.objects.select_related("user", "summary", "share")
            .prefetch_related("key_moments")
            .order_by("-created_at")
        )
        search = (request.query_params.get("search") or "").strip()
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(user__email__icontains=search))
        status_filter = (request.query_params.get("status") or "").strip()
        if status_filter:
            qs = qs.filter(status=status_filter)

        return success_response(
            "Content retrieved.",
            data=_paginate(request, qs, VideoListSerializer, context={"request": request}),
        )


class AdminJobsView(APIView):
    """
    GET /api/v1/admin/jobs — AI processing job monitor.

    Jobs are tracked on the Video row (status/progress/current_step/celery id),
    so this reports live pipeline state without a separate job table.
    """

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        active = (
            Video.objects.filter(status__in=[Video.Status.PENDING, Video.Status.PROCESSING])
            .select_related("user").order_by("-updated_at")
        )
        recent_failed = (
            Video.objects.filter(status=Video.Status.FAILED)
            .select_related("user").order_by("-updated_at")[:20]
        )
        day_ago = timezone.now() - timedelta(days=1)

        def _row(v):
            return {
                "video_id": str(v.id),
                "title": v.title,
                "owner": v.user.email,
                "status": v.status,
                "progress": v.progress,
                "current_step": v.current_step,
                "celery_task_id": v.celery_task_id,
                "error_message": v.error_message,
                "updated_at": v.updated_at,
            }

        completed_24h = Video.objects.filter(status=Video.Status.COMPLETED, updated_at__gte=day_ago).count()
        failed_24h = Video.objects.filter(status=Video.Status.FAILED, updated_at__gte=day_ago).count()
        processed_24h = completed_24h + failed_24h

        return success_response("Processing jobs retrieved.", data={
            "active_count": active.count(),
            "queued_count": Video.objects.filter(status=Video.Status.PENDING).count(),
            "failed_count": Video.objects.filter(status=Video.Status.FAILED).count(),
            "completed_count": Video.objects.filter(status=Video.Status.COMPLETED).count(),
            "completed_24h": completed_24h,
            "failed_24h": failed_24h,
            "success_rate_24h": round(completed_24h / processed_24h * 100, 1) if processed_24h else None,
            "active": [_row(v) for v in active],
            "recent_failures": [_row(v) for v in recent_failed],
        })


class AdminStorageView(APIView):
    """GET /api/v1/admin/storage — storage and resource utilisation."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        by_user, by_format, total = {}, {}, 0

        for video in Video.objects.select_related("user").only("user_id", "video_file", "user"):
            size = _video_size(video)
            total += size
            if size:
                by_user[video.user.email] = by_user.get(video.user.email, 0) + size
                ext = os.path.splitext(video.video_file.name)[1].lower() or "unknown"
                by_format[ext] = by_format.get(ext, 0) + size

        def _dir_size(path):
            total_bytes = 0
            if not os.path.isdir(path):
                return 0
            for root, _dirs, files in os.walk(path):
                for name in files:
                    try:
                        total_bytes += os.path.getsize(os.path.join(root, name))
                    except OSError:
                        continue
            return total_bytes

        media_root = str(settings.MEDIA_ROOT)
        thumbnails = _dir_size(os.path.join(media_root, "thumbnails"))

        top_users = sorted(
            ({"email": k, "bytes": v, "mb": round(v / (1024 * 1024), 2)} for k, v in by_user.items()),
            key=lambda x: x["bytes"], reverse=True,
        )[:10]

        return success_response("Storage statistics retrieved.", data={
            "total_bytes": total,
            "total_mb": round(total / (1024 * 1024), 2),
            "media_root_bytes": _dir_size(media_root),
            "thumbnail_bytes": thumbnails,
            "video_count": Video.objects.exclude(video_file="").count(),
            "by_format": [
                {"format": k, "bytes": v, "mb": round(v / (1024 * 1024), 2)}
                for k, v in sorted(by_format.items(), key=lambda x: -x[1])
            ],
            "top_users": top_users,
        })


class AdminAuditLogView(APIView):
    """GET /api/v1/admin/audit-logs — the privileged-action audit trail."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        qs = AuditLog.objects.all()
        action = (request.query_params.get("action") or "").strip()
        if action:
            qs = qs.filter(action__icontains=action)
        return success_response("Audit logs retrieved.", data=_paginate(request, qs, AuditLogSerializer))


class AdminContactMessageView(APIView):
    """
    GET   /api/v1/admin/contact-messages — read public contact submissions
    PATCH /api/v1/admin/contact-messages — mark one read/unread {id, is_read}
    """

    permission_classes = [IsAuthenticated, IsAdmin]
    parser_classes = [JSONParser]

    def get(self, request):
        qs = ContactMessage.objects.all()
        if request.query_params.get("unread") == "true":
            qs = qs.filter(is_read=False)
        data = _paginate(request, qs, ContactMessageSerializer)
        data["unread_count"] = ContactMessage.objects.filter(is_read=False).count()
        return success_response("Contact messages retrieved.", data=data)

    def patch(self, request):
        message_id = request.data.get("id")
        if not message_id:
            return error_response("'id' is required.")
        message = ContactMessage.objects.filter(pk=message_id).first()
        if not message:
            return error_response("Message not found.", http_status=status.HTTP_404_NOT_FOUND)
        message.is_read = bool(request.data.get("is_read", True))
        message.save(update_fields=["is_read"])
        return success_response("Message updated.", data=ContactMessageSerializer(message).data)


class AdminSettingsView(APIView):
    """
    GET   /api/v1/admin/settings — read platform configuration
    PATCH /api/v1/admin/settings — update it ({"key": value, ...})
    """

    permission_classes = [IsAuthenticated, IsAdmin]
    parser_classes = [JSONParser]

    #: Editable settings with their defaults and descriptions.
    DEFAULTS = {
        "max_upload_mb": (2048, "Maximum upload size in megabytes"),
        "allow_registration": (True, "Allow new users to self-register"),
        "allow_youtube_ingest": (True, "Allow ingestion from YouTube URLs"),
        "default_role": ("learner", "Role assigned to new registrations by default"),
        "maintenance_mode": (False, "Block non-admin API writes while enabled"),
    }

    def get(self, request):
        existing = {s.key: s for s in PlatformSetting.objects.all()}
        rows = []
        for key, (default, description) in self.DEFAULTS.items():
            setting = existing.get(key)
            rows.append({
                "key": key,
                "value": setting.value.get("v", default) if setting else default,
                "description": description,
                "updated_at": setting.updated_at if setting else None,
            })
        return success_response("Settings retrieved.", data=rows)

    def patch(self, request):
        updated = []
        for key, value in request.data.items():
            if key not in self.DEFAULTS:
                return error_response(f"Unknown setting '{key}'.")
            default, description = self.DEFAULTS[key]
            # Reject a type change — a bool setting must stay a bool.
            if not isinstance(value, type(default)) and not (
                isinstance(default, (int, float)) and isinstance(value, (int, float))
            ):
                return error_response(
                    f"Setting '{key}' expects a {type(default).__name__}."
                )
            PlatformSetting.objects.update_or_create(
                key=key, defaults={"value": {"v": value}, "description": description},
            )
            updated.append(key)

        if not updated:
            return error_response("No settings supplied.")

        record_audit(
            request.user, "settings.update", target_type="settings",
            detail=f"Updated: {', '.join(updated)}", request=request,
        )
        return self.get(request)
