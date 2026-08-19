"""
Role-based access control for ClipMind AI.

The platform defines four roles (see accounts.User.Role):

    content_creator — uploads and manages content for an audience
    learner         — consumes shared content; may NOT upload
    educator        — uploads lectures, edits transcripts, teaches a class
    admin           — operates the platform

Every permission below is a thin, composable DRF permission class. Views state
their access rules declaratively via `permission_classes`, so the rules are
auditable in one place rather than scattered through view bodies.
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdmin(BasePermission):
    """Administrators only."""

    message = "Administrator access required."

    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(user and user.is_authenticated and user.role == "admin")


class IsEducator(BasePermission):
    """Educators only (administrators are also allowed, as platform operators)."""

    message = "Educator access required."

    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(user and user.is_authenticated and user.role in {"educator", "admin"})


class IsContentCreator(BasePermission):
    """Content creators only (administrators also allowed)."""

    message = "Content Creator access required."

    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(user and user.is_authenticated and user.role in {"content_creator", "admin"})


class CanUpload(BasePermission):
    """
    Any role permitted to submit videos into the AI pipeline.

    Learners are read-only consumers, so they are rejected here — this is the
    single enforcement point for "Learners cannot upload".
    """

    message = "Your role does not permit uploading videos."

    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(user and user.is_authenticated and user.can_upload)


class CanEditTranscript(BasePermission):
    """
    Transcript editing is an authoring action: educators (review and edit
    transcripts), content creators (own content), and admins.
    """

    message = "Your role does not permit editing transcripts."

    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.role in {"educator", "content_creator", "admin"}
        )


class IsOwnerOrAdmin(BasePermission):
    """Object-level: only the owning user or an administrator may act."""

    message = "You do not have permission to access this resource."

    def has_object_permission(self, request, view, obj) -> bool:
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.role == "admin":
            return True
        owner = getattr(obj, "user", getattr(obj, "owner", None))
        return owner == user


class IsOwnerOrReadOnlyShared(BasePermission):
    """
    Object-level: owners and admins get full access; everyone else gets
    read-only access, and only when the object has been shared with them.

    Used for video detail so a Learner can read a shared video but never
    mutate or delete it.
    """

    message = "You do not have permission to access this video."

    def has_object_permission(self, request, view, obj) -> bool:
        from apps.videos.services import user_can_view_video

        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.role == "admin" or getattr(obj, "user_id", None) == user.id:
            return True
        # Non-owners are read-only, and only for shared content.
        return request.method in SAFE_METHODS and user_can_view_video(user, obj)
