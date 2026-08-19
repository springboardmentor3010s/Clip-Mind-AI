"""
Authentication service for ClipMind AI.
All business logic lives here — views remain thin.
"""
import logging
import secrets
from django.contrib.auth import authenticate
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from .models import User
from core.exceptions import AuthenticationFailedError

logger = logging.getLogger("api")

# Password reset token TTL (in seconds)
RESET_TOKEN_TTL = 60 * 30  # 30 minutes
RESET_TOKEN_CACHE_PREFIX = "pwd_reset:"


class AuthService:
    """Handles all authentication operations."""

    # ------------------------------------------------------------------ #
    # Login
    # ------------------------------------------------------------------ #
    @staticmethod
    def login(email: str, password: str) -> tuple[User, dict]:
        """
        Authenticate a user and return JWT tokens.

        Returns
        -------
        (user, tokens) where tokens = {"access": ..., "refresh": ...}
        """
        user = authenticate(username=email.lower(), password=password)
        if user is None:
            logger.warning("Failed login attempt | email=%s", email)
            raise AuthenticationFailedError("Invalid email or password.")
        if not user.is_active:
            raise AuthenticationFailedError("Your account has been deactivated.")

        tokens = AuthService._generate_tokens(user)
        logger.info("User logged in | id=%s", user.id)
        return user, tokens

    # ------------------------------------------------------------------ #
    # Logout
    # ------------------------------------------------------------------ #
    @staticmethod
    def logout(refresh_token: str) -> None:
        """Blacklist the provided refresh token."""
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            logger.info("Token blacklisted successfully.")
        except Exception as exc:
            logger.warning("Logout failed — token may already be invalid: %s", exc)
            raise AuthenticationFailedError("Invalid or expired refresh token.")

    # ------------------------------------------------------------------ #
    # Refresh
    # ------------------------------------------------------------------ #
    @staticmethod
    def refresh_token(refresh_token: str) -> dict:
        """
        Rotate the refresh token using SimpleJWT's built-in serializer so that
        BLACKLIST_AFTER_ROTATION and ROTATE_REFRESH_TOKENS settings are honoured.
        The old token is blacklisted; a brand-new token pair is returned.
        """
        try:
            serializer = TokenRefreshSerializer(data={"refresh": refresh_token})
            serializer.is_valid(raise_exception=True)
            return {
                "access": str(serializer.validated_data["access"]),
                "refresh": str(serializer.validated_data.get("refresh", refresh_token)),
            }
        except Exception as exc:
            logger.warning("Token refresh failed: %s", exc)
            raise AuthenticationFailedError("Invalid or expired refresh token.")

    # ------------------------------------------------------------------ #
    # Forgot Password
    # ------------------------------------------------------------------ #
    @staticmethod
    def forgot_password(email: str) -> str:
        """
        Generate a password-reset token, cache it, and email the reset link.
        Always returns success to prevent email enumeration.
        """
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            logger.info("Password reset requested for unknown email.")
            return ""

        reset_token = secrets.token_urlsafe(32)
        cache_key = f"{RESET_TOKEN_CACHE_PREFIX}{reset_token}"
        cache.set(cache_key, str(user.id), RESET_TOKEN_TTL)
        logger.info("Password reset token generated | user_id=%s", user.id)

        # Build the reset URL (frontend handles the form at /reset-password?token=)
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
        reset_url = f"{frontend_url}/reset-password?token={reset_token}"

        try:
            send_mail(
                subject="ClipMind AI — Reset your password",
                message=(
                    f"Hi {user.first_name},\n\n"
                    f"You requested a password reset for your ClipMind AI account.\n\n"
                    f"Click the link below to reset your password (valid for 30 minutes):\n"
                    f"{reset_url}\n\n"
                    f"If you did not request this, you can safely ignore this email.\n\n"
                    f"— The ClipMind AI Team"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            logger.info("Password reset email sent | user_id=%s", user.id)
        except Exception as exc:
            # Log the failure but do NOT raise — the API still returns success
            # to prevent email enumeration.
            logger.error("Failed to send reset email | user_id=%s | error=%s", user.id, exc)

        return reset_token

    # ------------------------------------------------------------------ #
    # Reset Password
    # ------------------------------------------------------------------ #
    @staticmethod
    def reset_password(token: str, new_password: str) -> None:
        """Apply new password using a valid reset token."""
        cache_key = f"{RESET_TOKEN_CACHE_PREFIX}{token}"
        user_id = cache.get(cache_key)

        if not user_id:
            raise AuthenticationFailedError("Invalid or expired password reset token.")

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise AuthenticationFailedError("User not found.")

        user.set_password(new_password)
        user.save(update_fields=["password", "updated_at"])
        cache.delete(cache_key)
        logger.info("Password reset successful | user_id=%s", user.id)

    # ------------------------------------------------------------------ #
    # Change Password
    # ------------------------------------------------------------------ #
    @staticmethod
    def change_password(user: User, old_password: str, new_password: str) -> None:
        """Verify old password then set new password."""
        if not user.check_password(old_password):
            raise AuthenticationFailedError("Current password is incorrect.")
        user.set_password(new_password)
        user.save(update_fields=["password", "updated_at"])
        logger.info("Password changed | user_id=%s", user.id)

    # ------------------------------------------------------------------ #
    # Internal helpers
    # ------------------------------------------------------------------ #
    @staticmethod
    def _generate_tokens(user: User) -> dict:
        """Return a fresh access + refresh token pair for the given user."""
        refresh = RefreshToken.for_user(user)
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }
