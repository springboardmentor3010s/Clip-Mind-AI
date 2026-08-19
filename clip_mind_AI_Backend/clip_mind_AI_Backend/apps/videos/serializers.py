import json
from rest_framework import serializers

from apps.videos.models import (
    Video, VideoShare, Bookmark, LearningHistory, VideoView,
)
from apps.transcripts.models import Transcript
from apps.summaries.models import Summary, KeyMoment, LearningMaterial
from core.media import sign_media_path


def _signed_video_url(video, request=None):
    """
    Absolute, signed URL for a video file.

    Video media is access-controlled (see core.media), and a <video> element
    cannot send an Authorization header — so the playable URL carries a
    short-lived signed token bound to that exact file path.
    """
    if not video.video_file:
        return None
    token = sign_media_path(video.video_file.name)
    url = f"{video.video_file.url}?t={token}"
    return request.build_absolute_uri(url) if request else url


class TranscriptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transcript
        fields = [
            "id", "content", "segments", "language", "word_count",
            "is_edited", "edited_at", "created_at",
        ]


class TranscriptUpdateSerializer(serializers.Serializer):
    """
    Payload for transcript editing (Module 3 — "Transcript editing").

    Either the full plain text, the timestamped segments, or both may be sent.
    Segments keep their timing; only `text` is editable, so corrections can
    never desynchronise the transcript from the player.
    """
    content = serializers.CharField(required=False, allow_blank=True)
    segments = serializers.ListField(child=serializers.DictField(), required=False)

    def validate(self, attrs):
        if "content" not in attrs and "segments" not in attrs:
            raise serializers.ValidationError("Provide 'content' and/or 'segments' to update.")
        return attrs

    def validate_segments(self, value):
        cleaned = []
        for i, seg in enumerate(value):
            if "text" not in seg:
                raise serializers.ValidationError(f"Segment {i} is missing 'text'.")
            try:
                start = float(seg.get("start", 0.0))
                duration = float(seg.get("duration", 0.0))
            except (TypeError, ValueError):
                raise serializers.ValidationError(f"Segment {i} has a non-numeric start/duration.")
            cleaned.append({
                "start": start,
                "duration": duration,
                "text": str(seg.get("text", "")),
            })
        return cleaned


class SummarySerializer(serializers.ModelSerializer):
    content = serializers.SerializerMethodField()

    class Meta:
        model = Summary
        fields = ["id", "content", "word_count", "ai_provider", "created_at"]

    def get_content(self, obj):
        try:
            return json.loads(obj.content)
        except Exception:
            return {"detailed_summary": obj.content}


class KeyMomentSerializer(serializers.ModelSerializer):
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = KeyMoment
        fields = ["id", "title", "description", "timestamp_seconds", "order", "thumbnail_url"]

    def get_thumbnail_url(self, obj):
        if obj.thumbnail:
            request = self.context.get("request")
            return request.build_absolute_uri(obj.thumbnail.url) if request else obj.thumbnail.url
        return None


class VideoSerializer(serializers.ModelSerializer):
    transcript = TranscriptSerializer(read_only=True)
    summary = SummarySerializer(read_only=True)
    key_moments = KeyMomentSerializer(many=True, read_only=True)
    video_file_url = serializers.SerializerMethodField()
    owner_email = serializers.EmailField(source="user.email", read_only=True)
    owner_name = serializers.CharField(source="user.full_name", read_only=True)
    is_owner = serializers.SerializerMethodField()
    share = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()

    class Meta:
        model = Video
        fields = [
            "id",
            "title",
            "source_url",
            "youtube_id",
            "thumbnail_url",
            "status",
            "progress",
            "current_step",
            "error_message",
            "duration_seconds",
            "source_language",
            "created_at",
            "updated_at",
            "video_file",
            "video_file_url",
            "transcript",
            "summary",
            "key_moments",
            "owner_email",
            "owner_name",
            "is_owner",
            "share",
            "is_bookmarked",
        ]

    def get_video_file_url(self, obj):
        return _signed_video_url(obj, self.context.get("request"))

    def _request_user(self):
        request = self.context.get("request")
        return getattr(request, "user", None) if request else None

    def get_is_owner(self, obj):
        user = self._request_user()
        return bool(user and user.is_authenticated and obj.user_id == user.id)

    def get_share(self, obj):
        share = getattr(obj, "share", None)
        if not share:
            return None
        return {
            "token": share.token,
            "is_public": share.is_public,
            "note": share.note,
            "created_at": share.created_at,
        }

    def get_is_bookmarked(self, obj):
        user = self._request_user()
        if not (user and user.is_authenticated):
            return False
        return Bookmark.objects.filter(user=user, video=obj).exists()


class VideoListSerializer(serializers.ModelSerializer):
    """
    Lightweight video row for lists, library browsing and search results.

    Deliberately omits transcript/summary/key-moment payloads — sending those
    for every row is what made the dashboard list slow and large.
    """
    video_file_url = serializers.SerializerMethodField()
    owner_name = serializers.CharField(source="user.full_name", read_only=True)
    owner_email = serializers.EmailField(source="user.email", read_only=True)
    is_owner = serializers.SerializerMethodField()
    is_shared = serializers.SerializerMethodField()
    has_summary = serializers.SerializerMethodField()
    key_moment_count = serializers.SerializerMethodField()

    class Meta:
        model = Video
        fields = [
            "id", "title", "youtube_id", "thumbnail_url", "status", "progress",
            "current_step", "duration_seconds", "created_at", "video_file",
            "video_file_url", "owner_name", "owner_email", "is_owner",
            "is_shared", "has_summary", "key_moment_count",
        ]

    def get_video_file_url(self, obj):
        return _signed_video_url(obj, self.context.get("request"))

    def get_is_owner(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None) if request else None
        return bool(user and user.is_authenticated and obj.user_id == user.id)

    def get_is_shared(self, obj):
        return getattr(obj, "share", None) is not None

    def get_has_summary(self, obj):
        return getattr(obj, "summary", None) is not None

    def get_key_moment_count(self, obj):
        return len(obj.key_moments.all())


class VideoShareSerializer(serializers.ModelSerializer):
    share_url = serializers.SerializerMethodField()
    recipient_count = serializers.SerializerMethodField()

    class Meta:
        model = VideoShare
        fields = ["id", "token", "is_public", "note", "share_url", "recipient_count", "created_at"]

    def get_share_url(self, obj):
        from django.conf import settings
        return f"{settings.FRONTEND_URL.rstrip('/')}/shared/{obj.token}"

    def get_recipient_count(self, obj):
        return obj.shared_with.count()


class BookmarkSerializer(serializers.ModelSerializer):
    video = VideoListSerializer(read_only=True)

    class Meta:
        model = Bookmark
        fields = ["id", "video", "note", "timestamp_seconds", "created_at"]


class LearningHistorySerializer(serializers.ModelSerializer):
    video = VideoListSerializer(read_only=True)

    class Meta:
        model = LearningHistory
        fields = [
            "id", "video", "view_count", "last_position_seconds",
            "completed", "first_viewed_at", "last_viewed_at",
        ]


class LearningMaterialSerializer(serializers.ModelSerializer):
    kind_display = serializers.CharField(source="get_kind_display", read_only=True)
    video_title = serializers.CharField(source="video.title", read_only=True)
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True)

    class Meta:
        model = LearningMaterial
        fields = [
            "id", "video", "video_title", "kind", "kind_display", "title",
            "content", "created_by_name", "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class PublicSharedVideoSerializer(serializers.ModelSerializer):
    """
    The unauthenticated /shared/<token> payload.

    Only presentation data is exposed — no owner email, no processing
    internals, no error messages, no file paths beyond the playable URL.
    """
    summary = SummarySerializer(read_only=True)
    transcript = TranscriptSerializer(read_only=True)
    key_moments = KeyMomentSerializer(many=True, read_only=True)
    video_file_url = serializers.SerializerMethodField()
    shared_by = serializers.SerializerMethodField()

    class Meta:
        model = Video
        fields = [
            "id", "title", "youtube_id", "thumbnail_url", "duration_seconds",
            "video_file_url", "summary", "transcript", "key_moments",
            "shared_by", "created_at",
        ]

    def get_video_file_url(self, obj):
        return _signed_video_url(obj, self.context.get("request"))

    def get_shared_by(self, obj):
        return obj.user.full_name or "ClipMind AI user"
