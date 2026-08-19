"""
Production-ready Custom User Model for ClipMind AI.
"""

import uuid

from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)


class UserManager(BaseUserManager):
    """Custom User Manager"""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required.")

        email = self.normalize_email(email)

        user = self.model(
            email=email,
            **extra_fields
        )

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(using=self._db)

        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("role", User.Role.ADMIN)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_verified", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True")

        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True")

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):

    class Role(models.TextChoices):
        """
        The four platform roles defined by the ClipMind AI specification.

        CONTENT_CREATOR — uploads and manages content for an audience.
        LEARNER         — consumes shared content (read-only, cannot upload).
        EDUCATOR        — uploads lectures, edits transcripts, shares with students.
        ADMIN           — operates the platform.
        """
        CONTENT_CREATOR = "content_creator", "Content Creator"
        LEARNER = "learner", "Learner"
        EDUCATOR = "educator", "Educator"
        ADMIN = "admin", "Administrator"

    #: Roles permitted to upload videos and run the AI pipeline.
    UPLOADER_ROLES = {"content_creator", "educator", "admin"}

    class LoginProvider(models.TextChoices):
        EMAIL = "email", "Email"
        GOOGLE = "google", "Google"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    email = models.EmailField(
        unique=True,
        db_index=True
    )

    first_name = models.CharField(
        max_length=100
    )

    last_name = models.CharField(
        max_length=100,
        blank=True
    )

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.LEARNER
    )

    profile_image = models.ImageField(
        upload_to="profile/",
        null=True,
        blank=True
    )

    login_provider = models.CharField(
        max_length=20,
        choices=LoginProvider.choices,
        default=LoginProvider.EMAIL
    )

    is_verified = models.BooleanField(
        default=False
    )

    is_active = models.BooleanField(
        default=True
    )

    is_staff = models.BooleanField(
        default=False
    )

    last_login_ip = models.GenericIPAddressField(
        null=True,
        blank=True
    )

    last_login_device = models.CharField(
        max_length=255,
        blank=True
    )

    deleted_at = models.DateTimeField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    objects = UserManager()

    USERNAME_FIELD = "email"

    REQUIRED_FIELDS = ["first_name"]

    class Meta:
        db_table = "users"
        ordering = ["-created_at"]
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN

    @property
    def is_educator(self):
        return self.role == self.Role.EDUCATOR

    @property
    def is_learner(self):
        return self.role == self.Role.LEARNER

    @property
    def is_content_creator(self):
        return self.role == self.Role.CONTENT_CREATOR

    @property
    def can_upload(self) -> bool:
        """Learners consume content only — every other role may upload."""
        return self.role in self.UPLOADER_ROLES


class ActivityLog(models.Model):
    """
    User-facing activity history (Module 1 — "Activity history").

    Records what a user did, so Learners can see their learning history and
    Administrators can monitor platform activity. Distinct from AuditLog,
    which records privileged administrative actions only.
    """

    class Action(models.TextChoices):
        REGISTER = "register", "Registered"
        LOGIN = "login", "Logged in"
        UPLOAD = "upload", "Uploaded a video"
        TRANSCRIPT_GENERATED = "transcript_generated", "Transcript generated"
        SUMMARY_GENERATED = "summary_generated", "Summary generated"
        TRANSCRIPT_EDITED = "transcript_edited", "Transcript edited"
        VIDEO_VIEWED = "video_viewed", "Viewed a video"
        VIDEO_DELETED = "video_deleted", "Deleted a video"
        BOOKMARK_ADDED = "bookmark_added", "Bookmarked"
        BOOKMARK_REMOVED = "bookmark_removed", "Removed bookmark"
        SHARED = "shared", "Shared content"
        UNSHARED = "unshared", "Revoked a share"
        MATERIAL_CREATED = "material_created", "Created learning material"
        SEARCH = "search", "Searched"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="activities",
    )

    action = models.CharField(max_length=40, choices=Action.choices, db_index=True)
    description = models.CharField(max_length=500, blank=True)

    # Loose reference — the target may be deleted later, so this is not an FK.
    target_id = models.CharField(max_length=64, blank=True)
    target_type = models.CharField(max_length=40, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "activity_logs"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "-created_at"])]

    def __str__(self):
        return f"{self.user_id} {self.action} @ {self.created_at}"


class AuditLog(models.Model):
    """
    Administrative audit trail (Administrator — "Access audit logs and reports").

    Only privileged/administrative actions are recorded here, with the acting
    admin, the affected object, and the request IP for accountability.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    actor = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,   # keep the audit trail if the admin is deleted
        null=True,
        blank=True,
        related_name="audit_entries",
    )
    actor_email = models.EmailField(blank=True)  # denormalised so it survives deletion

    action = models.CharField(max_length=80, db_index=True)
    target_type = models.CharField(max_length=40, blank=True)
    target_id = models.CharField(max_length=64, blank=True)
    detail = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "audit_logs"
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.created_at}] {self.actor_email} {self.action}"


class ContactMessage(models.Model):
    """
    A message submitted through the public Contact page.

    Persisted first, then emailed — so a mail outage never loses an enquiry.
    Administrators read and triage these from the admin dashboard.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    name = models.CharField(max_length=120)
    email = models.EmailField()
    subject = models.CharField(max_length=200)
    message = models.TextField()

    is_read = models.BooleanField(default=False)
    # False when SMTP was unavailable — lets an admin spot undelivered mail.
    email_sent = models.BooleanField(default=False)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "contact_messages"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} <{self.email}>: {self.subject}"


class PlatformSetting(models.Model):
    """
    Key/value platform configuration editable by Administrators
    ("Configure platform settings"). Values are stored as JSON.
    """

    key = models.CharField(max_length=100, primary_key=True)
    value = models.JSONField(default=dict)
    description = models.CharField(max_length=255, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "platform_settings"
        ordering = ["key"]

    def __str__(self):
        return self.key