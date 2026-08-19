import os
import logging

from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from core.responses import success_response, error_response, created_response
from core.permissions import CanUpload, CanEditTranscript
from core.logging_service import record_activity, record_audit
from core.pagination import StandardPagination
from utils.validators import validate_video_file, validate_youtube_url, normalize_language_hint
from apps.accounts.models import ActivityLog, User
from apps.videos.models import (
    Video, VideoShare, Bookmark, LearningHistory, VideoView,
)
from apps.summaries.models import LearningMaterial
from apps.videos.serializers import (
    VideoSerializer, VideoListSerializer, VideoShareSerializer,
    BookmarkSerializer, LearningHistorySerializer, LearningMaterialSerializer,
    PublicSharedVideoSerializer, TranscriptUpdateSerializer,
)
from apps.videos.services import (
    translate_video_content, visible_videos_qs, library_videos_qs,
    user_can_view_video, create_share,
)
from apps.processing.tasks import process_video_task

logger = logging.getLogger("api")


def _paginated(request, queryset, serializer_class):
    """Apply StandardPagination and return a serialized page payload."""
    paginator = StandardPagination()
    page = paginator.paginate_queryset(queryset, request)
    serializer = serializer_class(page, many=True, context={"request": request})
    return {
        "results": serializer.data,
        "count": paginator.page.paginator.count,
        "page": paginator.page.number,
        "num_pages": paginator.page.paginator.num_pages,
    }


def _get_viewable_video(request, pk):
    """
    Fetch a video the requesting user is allowed to READ.
    Returns (video, error_response). Exactly one is non-None.
    """
    video = Video.objects.filter(pk=pk).select_related("user", "transcript", "summary").first()
    if not video:
        return None, error_response("Video not found.", http_status=status.HTTP_404_NOT_FOUND)
    if not user_can_view_video(request.user, video):
        # 404 rather than 403 so the API never confirms that an id exists.
        return None, error_response("Video not found.", http_status=status.HTTP_404_NOT_FOUND)
    return video, None


def _get_owned_video(request, pk):
    """Fetch a video the requesting user OWNS (admins may act on any)."""
    qs = Video.objects.filter(pk=pk)
    if request.user.role != User.Role.ADMIN:
        qs = qs.filter(user=request.user)
    video = qs.first()
    if not video:
        return None, error_response("Video not found.", http_status=status.HTTP_404_NOT_FOUND)
    return video, None


# --------------------------------------------------------------------------- #
# Upload & ingestion
# --------------------------------------------------------------------------- #
class VideoUploadView(APIView):
    """POST /api/v1/videos/upload — upload a local video file. Learners are rejected."""

    permission_classes = [IsAuthenticated, CanUpload]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file_obj = request.FILES.get("file")
        if not file_obj:
            return error_response("No file provided.")

        try:
            validate_video_file(file_obj)
        except Exception as exc:
            return error_response(str(exc))

        try:
            video = Video.objects.create(
                user=request.user,
                video_file=file_obj,
                title=file_obj.name,
                status=Video.Status.PENDING,
                progress=0,
                current_step="Uploading",
                source_language=normalize_language_hint(request.data.get("language")),
            )
            process_video_task.delay(str(video.id))

            record_activity(
                request.user, ActivityLog.Action.UPLOAD,
                description=video.title, target_id=video.id, target_type="video",
            )
            logger.info("Video upload received | user=%s | video_id=%s", request.user.id, video.id)
            serializer = VideoSerializer(video, context={"request": request})
            return created_response("Video upload started.", data=serializer.data)
        except Exception as exc:
            logger.error("Failed to create video record | error=%s", exc)
            return error_response("Failed to upload video.")


class YouTubeURLView(APIView):
    """POST /api/v1/videos/youtube — submit a YouTube URL for analysis."""

    permission_classes = [IsAuthenticated, CanUpload]
    parser_classes = [JSONParser]

    def post(self, request):
        url = request.data.get("url")
        if not url:
            return error_response("YouTube URL is required.")

        try:
            validate_youtube_url(url)
        except Exception as exc:
            return error_response(str(exc))

        try:
            video = Video.objects.create(
                user=request.user,
                source_url=url,
                title="YouTube Video",
                status=Video.Status.PENDING,
                progress=0,
                current_step="Pending",
                source_language=normalize_language_hint(request.data.get("language")),
            )
            process_video_task.delay(str(video.id))

            record_activity(
                request.user, ActivityLog.Action.UPLOAD,
                description=url, target_id=video.id, target_type="video",
            )
            logger.info("YouTube URL received | user=%s | video_id=%s", request.user.id, video.id)
            serializer = VideoSerializer(video, context={"request": request})
            return created_response("YouTube analysis started.", data=serializer.data)
        except Exception as exc:
            logger.error("Failed to create video record for YouTube URL | error=%s", exc)
            return error_response("Failed to submit YouTube URL.")


# --------------------------------------------------------------------------- #
# Listing & detail
# --------------------------------------------------------------------------- #
class VideoListView(APIView):
    """
    GET /api/v1/videos — videos visible to the caller.

    Owners see their uploads; learners additionally see anything shared with
    them; administrators see everything. Uses select_related/prefetch_related
    to avoid the N+1 that nested serialisation would otherwise cause.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = visible_videos_qs(request.user).order_by("-created_at")

        search = (request.query_params.get("search") or "").strip()
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(source_url__icontains=search))

        status_filter = (request.query_params.get("status") or "").strip()
        if status_filter:
            qs = qs.filter(status=status_filter)

        # Full payloads are only sent when explicitly requested; the dashboard
        # list uses the light serializer.
        if request.query_params.get("full") == "true":
            serializer = VideoSerializer(qs, many=True, context={"request": request})
            return success_response("Videos retrieved.", data=serializer.data)

        if request.query_params.get("paginate") == "true":
            return success_response("Videos retrieved.", data=_paginated(request, qs, VideoListSerializer))

        serializer = VideoListSerializer(qs, many=True, context={"request": request})
        return success_response("Videos retrieved.", data=serializer.data)


class VideoLibraryView(APIView):
    """
    GET /api/v1/videos/library — the browsable library of shared content.

    This is the Learner's "Browse Videos" surface: completed videos that other
    users have shared, excluding the caller's own uploads.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = library_videos_qs(request.user).order_by("-created_at")
        search = (request.query_params.get("search") or "").strip()
        if search:
            qs = qs.filter(title__icontains=search)
        serializer = VideoListSerializer(qs, many=True, context={"request": request})
        return success_response("Library retrieved.", data=serializer.data)


class VideoDetailView(APIView):
    """
    GET    /api/v1/videos/<id> — full detail (owner, admin, or shared recipient)
    DELETE /api/v1/videos/<id> — delete (owner or admin only)
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        video, err = _get_viewable_video(request, pk)
        if err:
            return err
        serializer = VideoSerializer(video, context={"request": request})
        return success_response("Video retrieved.", data=serializer.data)

    def delete(self, request, pk):
        video, err = _get_owned_video(request, pk)
        if err:
            return err

        def _remove_file(field):
            try:
                if field and field.name and os.path.exists(field.path):
                    os.remove(field.path)
            except Exception as exc:
                logger.warning("Failed to delete file %s | error=%s", getattr(field, "name", "?"), exc)

        for moment in video.key_moments.all():
            _remove_file(moment.thumbnail)
        _remove_file(video.video_file)

        title, owner_id = video.title, video.user_id
        video.delete()

        record_activity(
            request.user, ActivityLog.Action.VIDEO_DELETED,
            description=title, target_id=pk, target_type="video",
        )
        # An admin deleting someone else's content is a privileged action.
        if request.user.role == User.Role.ADMIN and owner_id != request.user.id:
            record_audit(
                request.user, "video.delete", target_type="video", target_id=pk,
                detail=f"Admin deleted '{title}' owned by {owner_id}", request=request,
            )
        logger.info("Video deleted | user=%s | video_id=%s", request.user.id, pk)
        return success_response("Video deleted successfully.")


class VideoProgressView(APIView):
    """
    GET /api/v1/videos/<id>/progress — live processing status.

    Deliberately tiny: the frontend polls this every few seconds, so it must
    not re-serialise the transcript and summary on every tick.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        video, err = _get_viewable_video(request, pk)
        if err:
            return err
        return success_response("Progress retrieved.", data={
            "status": video.status,
            "progress": video.progress,
            "current_step": video.current_step,
            "error_message": video.error_message,
        })


class VideoTranslateView(APIView):
    """POST /api/v1/videos/<id>/translate — translate outputs into a language."""

    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def post(self, request, pk):
        video, err = _get_viewable_video(request, pk)
        if err:
            return err

        if video.status != Video.Status.COMPLETED:
            return error_response("Video has not finished processing yet.")

        language = (request.data.get("language") or "").strip()
        if not language:
            return error_response("A target language is required.")

        try:
            data = translate_video_content(video, language, request=request)
        except Exception as exc:
            logger.error("Translation failed | video_id=%s | lang=%s | error=%s", pk, language, exc)
            return error_response("Translation failed. Please try again.", http_status=status.HTTP_502_BAD_GATEWAY)

        return success_response("Translation ready.", data=data)


# --------------------------------------------------------------------------- #
# Transcript editing (Module 3)
# --------------------------------------------------------------------------- #
class TranscriptEditView(APIView):
    """
    PATCH /api/v1/videos/<id>/transcript — review and correct a transcript.

    Educators and content creators may correct AI output on their own videos;
    administrators may correct any. Segment timings are preserved so the
    player stays in sync with the corrected text.
    """

    permission_classes = [IsAuthenticated, CanEditTranscript]
    parser_classes = [JSONParser]

    def patch(self, request, pk):
        video, err = _get_owned_video(request, pk)
        if err:
            return err

        transcript = getattr(video, "transcript", None)
        if not transcript:
            return error_response(
                "This video has no transcript yet.", http_status=status.HTTP_404_NOT_FOUND
            )

        serializer = TranscriptUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Invalid transcript payload.", errors=serializer.errors)

        data = serializer.validated_data
        if "segments" in data:
            transcript.segments = data["segments"]
            # Keep plain text consistent with the edited segments unless the
            # caller supplied its own content explicitly.
            if "content" not in data:
                transcript.content = " ".join(s["text"].strip() for s in data["segments"]).strip()
        if "content" in data:
            transcript.content = data["content"]

        transcript.word_count = len(transcript.content.split())
        transcript.is_edited = True
        transcript.edited_by = request.user
        transcript.edited_at = timezone.now()
        transcript.save()

        record_activity(
            request.user, ActivityLog.Action.TRANSCRIPT_EDITED,
            description=video.title, target_id=video.id, target_type="video",
        )
        # Stored translations were derived from the old text — drop them so the
        # next translation request regenerates from the corrected transcript.
        video.translations.all().delete()

        from apps.videos.serializers import TranscriptSerializer
        return success_response(
            "Transcript updated.", data=TranscriptSerializer(transcript).data
        )


# --------------------------------------------------------------------------- #
# Sharing
# --------------------------------------------------------------------------- #
class VideoShareView(APIView):
    """
    POST   /api/v1/videos/<id>/share — share a video (creates a stable link)
    DELETE /api/v1/videos/<id>/share — revoke the share
    GET    /api/v1/videos/<id>/share — inspect the current share
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def get(self, request, pk):
        video, err = _get_owned_video(request, pk)
        if err:
            return err
        share = getattr(video, "share", None)
        if not share:
            return success_response("Not shared.", data=None)
        return success_response("Share retrieved.", data=VideoShareSerializer(share).data)

    def post(self, request, pk):
        video, err = _get_owned_video(request, pk)
        if err:
            return err

        if video.status != Video.Status.COMPLETED:
            return error_response("Only fully processed videos can be shared.")

        recipients = None
        emails = request.data.get("emails")
        if emails:
            if not isinstance(emails, list):
                return error_response("'emails' must be a list.")
            recipients = list(User.objects.filter(email__in=[e.lower() for e in emails]))
            if not recipients:
                return error_response("None of the supplied emails match a registered user.")

        share = create_share(
            video,
            owner=request.user,
            is_public=bool(request.data.get("is_public", True)),
            note=(request.data.get("note") or "")[:500],
            recipients=recipients,
        )

        record_activity(
            request.user, ActivityLog.Action.SHARED,
            description=video.title, target_id=video.id, target_type="video",
        )
        return success_response("Video shared.", data=VideoShareSerializer(share).data)

    def delete(self, request, pk):
        video, err = _get_owned_video(request, pk)
        if err:
            return err
        share = getattr(video, "share", None)
        if not share:
            return error_response("This video is not shared.", http_status=status.HTTP_404_NOT_FOUND)
        share.delete()
        record_activity(
            request.user, ActivityLog.Action.UNSHARED,
            description=video.title, target_id=video.id, target_type="video",
        )
        return success_response("Share revoked.")


class PublicSharedVideoView(APIView):
    """
    GET /api/v1/videos/shared/<token> — PUBLIC, unauthenticated share page.

    Only videos whose share is explicitly marked public are served. The payload
    is restricted to presentation data (see PublicSharedVideoSerializer).
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, token):
        share = (
            VideoShare.objects
            .select_related("video", "video__user", "video__summary", "video__transcript")
            .filter(token=token, is_public=True)
            .first()
        )
        if not share:
            return error_response("This share link is invalid or has been revoked.",
                                  http_status=status.HTTP_404_NOT_FOUND)

        video = share.video
        if video.status != Video.Status.COMPLETED:
            return error_response("This video is not ready yet.",
                                  http_status=status.HTTP_404_NOT_FOUND)

        serializer = PublicSharedVideoSerializer(video, context={"request": request})
        return success_response("Shared video retrieved.", data=serializer.data)


# --------------------------------------------------------------------------- #
# Engagement — views, bookmarks, history
# --------------------------------------------------------------------------- #
class VideoViewEventView(APIView):
    """
    POST /api/v1/videos/<id>/view — record a view + update learning history.

    This is the single signal that powers classroom analytics and the Learner's
    history, so it is recorded whenever a learner opens or plays a video.
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def post(self, request, pk):
        video, err = _get_viewable_video(request, pk)
        if err:
            return err

        try:
            position = float(request.data.get("position_seconds", 0) or 0)
        except (TypeError, ValueError):
            position = 0.0

        VideoView.objects.create(video=video, user=request.user, watch_seconds=position)

        history, created = LearningHistory.objects.get_or_create(
            user=request.user, video=video,
            defaults={"last_position_seconds": position, "view_count": 1},
        )
        if not created:
            history.view_count += 1
            history.last_position_seconds = max(history.last_position_seconds, position)
        # Treat 90%+ watched as completed.
        if video.duration_seconds and position >= video.duration_seconds * 0.9:
            history.completed = True
        history.save()

        record_activity(
            request.user, ActivityLog.Action.VIDEO_VIEWED,
            description=video.title, target_id=video.id, target_type="video",
        )
        return success_response("View recorded.", data={
            "view_count": history.view_count,
            "completed": history.completed,
        })


class BookmarkListView(APIView):
    """
    GET  /api/v1/videos/bookmarks — the caller's bookmarks
    POST /api/v1/videos/bookmarks — add a bookmark {video_id, note?, timestamp_seconds?}
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def get(self, request):
        qs = (
            Bookmark.objects.filter(user=request.user)
            .select_related("video", "video__user", "video__summary")
            .prefetch_related("video__key_moments")
        )
        return success_response(
            "Bookmarks retrieved.",
            data=BookmarkSerializer(qs, many=True, context={"request": request}).data,
        )

    def post(self, request):
        video_id = request.data.get("video_id")
        if not video_id:
            return error_response("'video_id' is required.")

        video, err = _get_viewable_video(request, video_id)
        if err:
            return err

        timestamp = request.data.get("timestamp_seconds")
        try:
            timestamp = float(timestamp) if timestamp is not None else None
        except (TypeError, ValueError):
            return error_response("'timestamp_seconds' must be a number.")

        bookmark, created = Bookmark.objects.get_or_create(
            user=request.user, video=video, timestamp_seconds=timestamp,
            defaults={"note": (request.data.get("note") or "")[:500]},
        )
        if created:
            record_activity(
                request.user, ActivityLog.Action.BOOKMARK_ADDED,
                description=video.title, target_id=video.id, target_type="video",
            )
        return success_response(
            "Bookmark saved." if created else "Already bookmarked.",
            data=BookmarkSerializer(bookmark, context={"request": request}).data,
        )


class BookmarkDetailView(APIView):
    """DELETE /api/v1/videos/bookmarks/<id> — remove a bookmark."""

    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        bookmark = Bookmark.objects.filter(pk=pk, user=request.user).select_related("video").first()
        if not bookmark:
            return error_response("Bookmark not found.", http_status=status.HTTP_404_NOT_FOUND)
        title = bookmark.video.title
        bookmark.delete()
        record_activity(
            request.user, ActivityLog.Action.BOOKMARK_REMOVED,
            description=title, target_type="video",
        )
        return success_response("Bookmark removed.")


class LearningHistoryView(APIView):
    """
    GET    /api/v1/videos/history — the caller's learning history
    DELETE /api/v1/videos/history — clear it
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = (
            LearningHistory.objects.filter(user=request.user)
            .select_related("video", "video__user", "video__summary")
            .prefetch_related("video__key_moments")
        )
        return success_response(
            "Learning history retrieved.",
            data=LearningHistorySerializer(qs, many=True, context={"request": request}).data,
        )

    def delete(self, request):
        deleted, _ = LearningHistory.objects.filter(user=request.user).delete()
        return success_response("Learning history cleared.", data={"deleted": deleted})


# --------------------------------------------------------------------------- #
# Cross-video search
# --------------------------------------------------------------------------- #
class TranscriptSearchView(APIView):
    """
    GET /api/v1/videos/search?q=... — search spoken words across every video
    the caller may see.

    Matching is done in the database on transcript content (so non-matching
    videos never leave Postgres), then matching segments are extracted in
    Python to build timestamped, clickable results.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = (request.query_params.get("q") or "").strip()
        if not query:
            return error_response("A search query 'q' is required.")
        if len(query) < 2:
            return error_response("Search query must be at least 2 characters.")

        videos = (
            visible_videos_qs(request.user)
            .filter(
                Q(transcript__content__icontains=query) | Q(title__icontains=query),
                status=Video.Status.COMPLETED,
            )
            .select_related("transcript", "user")
            .distinct()
        )

        needle = query.lower()
        results = []
        for video in videos:
            transcript = getattr(video, "transcript", None)
            matches = []
            if transcript:
                for seg in (transcript.segments or []):
                    text = seg.get("text", "") or ""
                    if needle in text.lower():
                        matches.append({
                            "start": seg.get("start", 0.0),
                            "text": text.strip(),
                        })
                    if len(matches) >= 20:   # cap per video to keep responses small
                        break
            results.append({
                "video_id": str(video.id),
                "title": video.title,
                "owner_name": video.user.full_name,
                "duration_seconds": video.duration_seconds,
                "youtube_id": video.youtube_id,
                "is_owner": video.user_id == request.user.id,
                "match_count": len(matches),
                "matches": matches,
            })

        results.sort(key=lambda r: r["match_count"], reverse=True)
        record_activity(request.user, ActivityLog.Action.SEARCH, description=query[:200])

        return success_response("Search complete.", data={
            "query": query,
            "video_count": len(results),
            "total_matches": sum(r["match_count"] for r in results),
            "results": results,
        })


# --------------------------------------------------------------------------- #
# Learning materials (Educator)
# --------------------------------------------------------------------------- #
class LearningMaterialListView(APIView):
    """
    GET  /api/v1/videos/materials — materials the caller may read
    POST /api/v1/videos/materials — generate one from a video's AI analysis

    Reading is open to any authenticated user but scoped by video visibility:
    a Learner sees the materials attached to videos shared with them, which is
    what makes "create learning materials from transcripts" useful to students.
    Creating remains restricted to educators/creators/admins.
    """

    parser_classes = [JSONParser]

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), CanEditTranscript()]
        return [IsAuthenticated()]

    def get(self, request):
        visible_ids = visible_videos_qs(request.user).values_list("id", flat=True)
        qs = (
            LearningMaterial.objects
            .filter(Q(created_by=request.user) | Q(video_id__in=visible_ids))
            .select_related("video", "created_by")
            .distinct()
        )
        video_id = request.query_params.get("video_id")
        if video_id:
            qs = qs.filter(video_id=video_id)
        return success_response(
            "Learning materials retrieved.",
            data=LearningMaterialSerializer(qs, many=True).data,
        )

    def post(self, request):
        video_id = request.data.get("video_id")
        if not video_id:
            return error_response("'video_id' is required.")

        video, err = _get_owned_video(request, video_id)
        if err:
            return err

        kind = request.data.get("kind", LearningMaterial.Kind.STUDY_NOTES)
        if kind not in LearningMaterial.Kind.values:
            return error_response(f"Invalid kind. Choose from: {', '.join(LearningMaterial.Kind.values)}")

        # Build the material from the analysis the pipeline already produced,
        # so no extra LLM call (and no extra cost/latency) is incurred.
        content = request.data.get("content")
        if not content:
            content = self._build_from_summary(video, kind)
            if content is None:
                return error_response("This video has no AI summary to build materials from.")

        material = LearningMaterial.objects.create(
            video=video,
            created_by=request.user,
            kind=kind,
            title=(request.data.get("title") or f"{video.title} — {kind.replace('_', ' ').title()}")[:255],
            content=content,
        )
        record_activity(
            request.user, ActivityLog.Action.MATERIAL_CREATED,
            description=material.title, target_id=material.id, target_type="material",
        )
        return created_response("Learning material created.", data=LearningMaterialSerializer(material).data)

    @staticmethod
    def _build_from_summary(video, kind):
        """Derive material content from the stored structured analysis."""
        import json as _json

        summary = getattr(video, "summary", None)
        if not summary:
            return None
        try:
            sections = _json.loads(summary.content)
        except (ValueError, TypeError):
            sections = {"detailed_summary": summary.content}

        if kind == LearningMaterial.Kind.QUIZ:
            return {"questions": sections.get("key_questions", [])}
        if kind == LearningMaterial.Kind.FLASHCARDS:
            return {"cards": [
                {"front": g.get("term", ""), "back": g.get("definition", "")}
                for g in sections.get("glossary", [])
            ]}
        if kind == LearningMaterial.Kind.LESSON_PLAN:
            return {
                "overview": sections.get("short_summary", ""),
                "chapters": sections.get("chapter_summary", []),
                "objectives": sections.get("important_topics", []),
                "activities": sections.get("action_items", []),
            }
        # Default: study notes
        return {
            "overview": sections.get("short_summary", ""),
            "notes": sections.get("detailed_summary", ""),
            "key_points": sections.get("bullet_summary", []),
            "glossary": sections.get("glossary", []),
            "topics": sections.get("important_topics", []),
        }


class LearningMaterialDetailView(APIView):
    """
    GET    /api/v1/videos/materials/<id>
    PATCH  /api/v1/videos/materials/<id> — edit title/content
    DELETE /api/v1/videos/materials/<id>
    """

    permission_classes = [IsAuthenticated, CanEditTranscript]
    parser_classes = [JSONParser]

    def _get(self, request, pk):
        return LearningMaterial.objects.filter(pk=pk, created_by=request.user).select_related("video").first()

    def get(self, request, pk):
        material = self._get(request, pk)
        if not material:
            return error_response("Material not found.", http_status=status.HTTP_404_NOT_FOUND)
        return success_response("Material retrieved.", data=LearningMaterialSerializer(material).data)

    def patch(self, request, pk):
        material = self._get(request, pk)
        if not material:
            return error_response("Material not found.", http_status=status.HTTP_404_NOT_FOUND)
        if "title" in request.data:
            material.title = str(request.data["title"])[:255]
        if "content" in request.data:
            if not isinstance(request.data["content"], dict):
                return error_response("'content' must be an object.")
            material.content = request.data["content"]
        material.save()
        return success_response("Material updated.", data=LearningMaterialSerializer(material).data)

    def delete(self, request, pk):
        material = self._get(request, pk)
        if not material:
            return error_response("Material not found.", http_status=status.HTTP_404_NOT_FOUND)
        material.delete()
        return success_response("Material deleted.")
