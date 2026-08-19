"""
Transcript model — stores the text + timestamped segments from a video.
"""
import uuid
from django.db import models


class Transcript(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    video = models.OneToOneField(
        "videos.Video",
        on_delete=models.CASCADE,
        related_name="transcript",
    )

    content    = models.TextField()           # Full plain-text transcript
    segments   = models.JSONField(default=list)  # [{start, duration, text}]
    language   = models.CharField(max_length=10, default="en")
    word_count = models.PositiveIntegerField(default=0)

    # Transcript editing (Module 3) — track manual corrections so an educator
    # reviewing AI output can see whether a transcript has been human-verified.
    is_edited = models.BooleanField(default=False)
    edited_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="edited_transcripts",
    )
    edited_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "transcripts"

    def __str__(self):
        return f"Transcript for video {self.video_id}"
