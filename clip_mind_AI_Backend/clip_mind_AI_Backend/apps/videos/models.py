"""
Video model — tracks every submitted YouTube URL and its processing lifecycle.
"""
import uuid
from django.db import models


class Video(models.Model):

    class Status(models.TextChoices):
        PENDING    = "pending",    "Pending"
        PROCESSING = "processing", "Processing"
        COMPLETED  = "completed",  "Completed"
        FAILED     = "failed",     "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="videos",
    )

    # Source
    source_url  = models.URLField(max_length=1000, blank=True, null=True)
    video_file  = models.FileField(upload_to="videos/", blank=True, null=True)
    youtube_id  = models.CharField(max_length=20, blank=True)
    title       = models.CharField(max_length=500, blank=True)
    thumbnail_url = models.URLField(blank=True)

    duration_seconds = models.FloatField(default=0.0)   # media duration for the player
    source_language  = models.CharField(max_length=10, blank=True)  # optional ISO-639-1 STT hint ("" = auto-detect)

    # Lifecycle
    status          = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    progress        = models.PositiveSmallIntegerField(default=0)   # 0-100
    current_step    = models.CharField(max_length=100, blank=True)  # human-readable step
    celery_task_id  = models.CharField(max_length=255, blank=True)
    error_message   = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "videos"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title or self.youtube_id} [{self.status}]"


class VideoTranslation(models.Model):
    """
    A cached translation of a video's AI outputs into ONE language.

    The original transcript / summary / key moments are never modified — each
    translation is stored here separately, keyed by (video, language), so it is
    generated only once and then reused. Persisted in the DB so translations
    survive restarts and are shared across Celery/web workers (Redis is used as
    a fast read-through cache on top of this).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    video = models.ForeignKey(
        "videos.Video",
        on_delete=models.CASCADE,      # deleting a video removes its translations
        related_name="translations",
    )
    language = models.CharField(max_length=40)
    # { "transcript_segments": [...], "summary": {...}, "key_moments": [...] }
    payload = models.JSONField(default=dict)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "video_translations"
        unique_together = (("video", "language"),)

    def __str__(self):
        return f"Translation[{self.language}] for video {self.video_id}"


class VideoShare(models.Model):
    """
    A share of one video, created by its owner (Educator: "Share summaries with
    students"; Content Creator: distribute to an audience).

    Two share modes coexist:
      - `is_public=True`  -> anyone holding the token may open /shared/<token>
                             without authenticating.
      - shared_with set   -> the named users see the video in their library.

    A single row carries both so an educator can share to the class *and* hand
    out a public link without duplicating records.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    video = models.OneToOneField(
        "videos.Video",
        on_delete=models.CASCADE,
        related_name="share",
    )
    owner = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="shares_created",
    )

    # Unguessable public token (URL-safe, 32 bytes of entropy).
    token = models.CharField(max_length=64, unique=True, db_index=True)

    is_public = models.BooleanField(default=True)
    # Empty = every Learner may see it in their library; non-empty = restricted.
    shared_with = models.ManyToManyField(
        "accounts.User",
        blank=True,
        related_name="shared_videos",
    )

    note = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "video_shares"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Share[{self.token[:8]}…] for video {self.video_id}"


class VideoView(models.Model):
    """
    One playback/open event by a user — the raw signal behind classroom
    analytics and "Monitor student engagement metrics".
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    video = models.ForeignKey(
        "videos.Video",
        on_delete=models.CASCADE,
        related_name="views",
    )
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="video_views",
    )
    # Furthest playback position reached, used for completion estimates.
    watch_seconds = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "video_views"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["video", "-created_at"]),
            models.Index(fields=["user", "-created_at"]),
        ]

    def __str__(self):
        return f"View by {self.user_id} on {self.video_id}"


class Bookmark(models.Model):
    """
    A Learner's saved video, optionally pinned to a timestamp so a specific
    highlight can be bookmarked rather than the whole video.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="bookmarks",
    )
    video = models.ForeignKey(
        "videos.Video",
        on_delete=models.CASCADE,
        related_name="bookmarks",
    )
    note = models.CharField(max_length=500, blank=True)
    timestamp_seconds = models.FloatField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "bookmarks"
        ordering = ["-created_at"]
        # One bookmark per (user, video, timestamp) — re-bookmarking the same
        # highlight is idempotent rather than creating duplicates.
        unique_together = (("user", "video", "timestamp_seconds"),)

    def __str__(self):
        return f"Bookmark {self.video_id} by {self.user_id}"


class LearningHistory(models.Model):
    """
    "Save learning history" — one row per (user, video), updated in place so the
    history reads as a most-recently-viewed list rather than an event stream.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="learning_history",
    )
    video = models.ForeignKey(
        "videos.Video",
        on_delete=models.CASCADE,
        related_name="learning_history",
    )

    view_count = models.PositiveIntegerField(default=1)
    last_position_seconds = models.FloatField(default=0.0)
    completed = models.BooleanField(default=False)

    first_viewed_at = models.DateTimeField(auto_now_add=True)
    last_viewed_at = models.DateTimeField(auto_now=True, db_index=True)

    class Meta:
        db_table = "learning_history"
        ordering = ["-last_viewed_at"]
        unique_together = (("user", "video"),)

    def __str__(self):
        return f"History {self.video_id} for {self.user_id}"
