"""
Summary and KeyMoment models.
"""
import uuid
from django.db import models


class Summary(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    video = models.OneToOneField(
        "videos.Video",
        on_delete=models.CASCADE,
        related_name="summary",
    )

    content     = models.TextField()
    word_count  = models.PositiveIntegerField(default=0)
    ai_provider = models.CharField(max_length=50, default="groq")
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "summaries"
        verbose_name_plural = "summaries"

    def __str__(self):
        return f"Summary for video {self.video_id}"


class KeyMoment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    video = models.ForeignKey(
        "videos.Video",
        on_delete=models.CASCADE,
        related_name="key_moments",
    )

    title             = models.CharField(max_length=255)
    description       = models.TextField(blank=True)
    timestamp_seconds = models.FloatField(default=0.0)
    order             = models.PositiveSmallIntegerField(default=0)
    thumbnail         = models.ImageField(upload_to="thumbnails/", null=True, blank=True)

    class Meta:
        db_table = "key_moments"
        ordering = ["order", "timestamp_seconds"]

    def __str__(self):
        return f"{self.title} @ {self.timestamp_seconds}s"


class LearningMaterial(models.Model):
    """
    Educator artefact generated from a transcript — "Create learning materials
    from transcripts".

    The AI analysis already produces glossary terms, exam-style key questions
    and action items; this model persists an educator-curated document built
    from those, so it can be edited and shared independently of the summary.
    """

    class Kind(models.TextChoices):
        STUDY_NOTES = "study_notes", "Study Notes"
        QUIZ = "quiz", "Quiz"
        FLASHCARDS = "flashcards", "Flashcards"
        LESSON_PLAN = "lesson_plan", "Lesson Plan"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    video = models.ForeignKey(
        "videos.Video",
        on_delete=models.CASCADE,
        related_name="learning_materials",
    )
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="learning_materials",
    )

    kind = models.CharField(max_length=30, choices=Kind.choices, default=Kind.STUDY_NOTES)
    title = models.CharField(max_length=255)
    # Structured payload; shape depends on `kind`
    # (e.g. quiz -> {"questions": [{"question": ..., "answer": ...}]}).
    content = models.JSONField(default=dict)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "learning_materials"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_kind_display()}: {self.title}"
