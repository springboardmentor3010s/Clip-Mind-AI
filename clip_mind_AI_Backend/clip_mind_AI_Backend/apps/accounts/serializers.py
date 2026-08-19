"""
Serializers for Accounts Module.
"""

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from utils.validators import validate_password_strength

from .models import User, ActivityLog, AuditLog, PlatformSetting, ContactMessage


# Roles a user may self-assign at registration. "admin" is deliberately absent —
# administrators are created via createsuperuser or promoted by another admin,
# so the public endpoint can never mint a privileged account.
SELF_ASSIGNABLE_ROLES = (
    User.Role.CONTENT_CREATOR,
    User.Role.LEARNER,
    User.Role.EDUCATOR,
)


class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        min_length=8
    )

    confirm_password = serializers.CharField(
        write_only=True
    )

    role = serializers.ChoiceField(
        choices=[(r.value, r.label) for r in SELF_ASSIGNABLE_ROLES],
        default=User.Role.LEARNER,
    )

    class Meta:
        model = User
        fields = (
            "email",
            "first_name",
            "last_name",
            "password",
            "confirm_password",
            "role",
        )

    def validate_email(self, value):

        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "Email already registered."
            )

        return value.lower()

    def validate_password(self, value):
        """Enforce the project's password policy (upper/lower/digit/special)."""
        try:
            validate_password_strength(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages)
        return value

    def validate_role(self, value):
        """Defence in depth — never let 'admin' through the public endpoint."""
        if value == User.Role.ADMIN:
            raise serializers.ValidationError("You cannot self-assign the administrator role.")
        return value

    def validate(self, attrs):

        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {
                    "confirm_password":
                    "Passwords do not match."
                }
            )

        return attrs

    def create(self, validated_data):

        validated_data.pop("confirm_password")

        return User.objects.create_user(
            **validated_data
        )


class LoginSerializer(serializers.Serializer):

    email = serializers.EmailField()

    password = serializers.CharField(
        write_only=True
    )
    # Authentication is intentionally NOT performed here.
    # Field validation only — AuthService.login() handles auth and raises
    # AuthenticationFailedError (HTTP 401) on bad credentials.


class UserProfileSerializer(serializers.ModelSerializer):

    full_name = serializers.ReadOnlyField()
    role_display = serializers.CharField(source="get_role_display", read_only=True)
    can_upload = serializers.ReadOnlyField()

    class Meta:
        model = User

        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "role_display",
            "can_upload",
            "profile_image",
            "is_verified",
            "created_at",
        )


class UpdateProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = User

        fields = (
            "first_name",
            "last_name",
            "profile_image",
        )


class ChangePasswordSerializer(serializers.Serializer):

    old_password = serializers.CharField()

    new_password = serializers.CharField()

    confirm_password = serializers.CharField()

    def validate_new_password(self, value):
        try:
            validate_password_strength(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages)
        return value

    def validate(self, attrs):

        if attrs["new_password"] != attrs["confirm_password"]:

            raise serializers.ValidationError(
                {
                    "confirm_password":
                    "Passwords do not match."
                }
            )

        return attrs


class AdminUserSerializer(serializers.ModelSerializer):
    """User row for the administrator's user-management table."""

    full_name = serializers.ReadOnlyField()
    role_display = serializers.CharField(source="get_role_display", read_only=True)
    video_count = serializers.IntegerField(read_only=True)
    storage_bytes = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "role_display",
            "is_active",
            "is_verified",
            "video_count",
            "storage_bytes",
            "created_at",
            "last_login",
        )


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    """Administrator edits: role assignment and activate/deactivate."""

    class Meta:
        model = User
        fields = ("role", "is_active")


class ActivityLogSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_name = serializers.CharField(source="user.full_name", read_only=True)
    user_role = serializers.CharField(source="user.get_role_display", read_only=True)
    action_display = serializers.CharField(source="get_action_display", read_only=True)

    class Meta:
        model = ActivityLog
        fields = (
            "id", "action", "action_display", "description",
            "target_id", "target_type",
            "user_email", "user_name", "user_role", "created_at",
        )


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = (
            "id", "actor_email", "action", "target_type",
            "target_id", "detail", "ip_address", "created_at",
        )


class PlatformSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformSetting
        fields = ("key", "value", "description", "updated_at")


class ContactMessageCreateSerializer(serializers.ModelSerializer):
    """Public contact-form submission."""

    class Meta:
        model = ContactMessage
        fields = ("name", "email", "subject", "message")

    def validate_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Please enter your name.")
        return value.strip()

    def validate_subject(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Please enter a subject.")
        return value.strip()

    def validate_message(self, value):
        cleaned = value.strip()
        if len(cleaned) < 10:
            raise serializers.ValidationError("Please write at least 10 characters.")
        if len(cleaned) > 5000:
            raise serializers.ValidationError("Message must be under 5000 characters.")
        return cleaned


class ContactMessageSerializer(serializers.ModelSerializer):
    """Admin-facing view of a submitted message."""

    class Meta:
        model = ContactMessage
        fields = (
            "id", "name", "email", "subject", "message",
            "is_read", "email_sent", "ip_address", "created_at",
        )


class ForgotPasswordSerializer(serializers.Serializer):

    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):

    token = serializers.CharField()

    password = serializers.CharField()

    confirm_password = serializers.CharField()

    def validate(self, attrs):

        if attrs["password"] != attrs["confirm_password"]:

            raise serializers.ValidationError(
                {
                    "confirm_password":
                    "Passwords do not match."
                }
            )

        return attrs