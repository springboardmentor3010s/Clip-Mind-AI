"""
Authentication views for ClipMind AI.
Views are thin — all logic is delegated to AuthService.
"""
import logging
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from core.responses import success_response, error_response, created_response
from core.logging_service import record_activity
from core.pagination import StandardPagination
from .models import ActivityLog
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserProfileSerializer,
    UpdateProfileSerializer,
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    ActivityLogSerializer,
)
from .services import AuthService

logger = logging.getLogger("api")


class RegisterView(APIView):
    """POST /api/v1/auth/register — create a new account."""

    permission_classes = [AllowAny]

    @extend_schema(request=RegisterSerializer, tags=["Authentication"])
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Registration failed.", errors=serializer.errors)

        user = serializer.save()
        record_activity(
            user, ActivityLog.Action.REGISTER,
            description=f"Registered as {user.get_role_display()}",
        )
        profile_data = UserProfileSerializer(user).data
        return created_response("Account created successfully.", data=profile_data)


class LoginView(APIView):
    """POST /api/v1/auth/login — obtain JWT tokens."""

    permission_classes = [AllowAny]

    @extend_schema(request=LoginSerializer, tags=["Authentication"])
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Login failed.", errors=serializer.errors)

        user, tokens = AuthService.login(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )
        record_activity(user, ActivityLog.Action.LOGIN, description="Signed in")
        return success_response(
            "Login successful.",
            data={
                "user": UserProfileSerializer(user).data,
                "tokens": tokens,
            },
        )


class LogoutView(APIView):
    """POST /api/v1/auth/logout — blacklist refresh token."""

    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["Authentication"])
    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return error_response("Refresh token is required.")
        AuthService.logout(refresh_token)
        return success_response("Logged out successfully.")


class TokenRefreshView(APIView):
    """POST /api/v1/auth/refresh — rotate tokens."""

    permission_classes = [AllowAny]

    @extend_schema(tags=["Authentication"])
    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return error_response("Refresh token is required.")
        tokens = AuthService.refresh_token(refresh_token)
        return success_response("Token refreshed.", data=tokens)


class ForgotPasswordView(APIView):
    """POST /api/v1/auth/forgot-password — request reset email."""

    permission_classes = [AllowAny]

    @extend_schema(request=ForgotPasswordSerializer, tags=["Authentication"])
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Invalid request.", errors=serializer.errors)

        # Token generated but NOT sent via email yet (email service is future module)
        # Always return success to prevent email enumeration
        AuthService.forgot_password(serializer.validated_data["email"])
        return success_response(
            "If this email is registered, a password reset link has been sent."
        )


class ResetPasswordView(APIView):
    """POST /api/v1/auth/reset-password — apply new password via token."""

    permission_classes = [AllowAny]

    @extend_schema(request=ResetPasswordSerializer, tags=["Authentication"])
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Invalid request.", errors=serializer.errors)

        AuthService.reset_password(
            token=serializer.validated_data["token"],
            new_password=serializer.validated_data["password"],
        )
        return success_response("Password has been reset successfully.")


class ChangePasswordView(APIView):
    """POST /api/v1/auth/change-password — change password while logged in."""

    permission_classes = [IsAuthenticated]

    @extend_schema(request=ChangePasswordSerializer, tags=["Authentication"])
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Invalid request.", errors=serializer.errors)

        AuthService.change_password(
            user=request.user,
            old_password=serializer.validated_data["old_password"],
            new_password=serializer.validated_data["new_password"],
        )
        return success_response("Password changed successfully.")


class ProfileView(APIView):
    """
    GET  /api/v1/auth/profile — retrieve own profile
    PATCH /api/v1/auth/profile — update own profile
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @extend_schema(tags=["Authentication"])
    def get(self, request):
        data = UserProfileSerializer(request.user).data
        return success_response("Profile retrieved.", data=data)

    @extend_schema(request=UpdateProfileSerializer, tags=["Authentication"])
    def patch(self, request):
        serializer = UpdateProfileSerializer(
            request.user, data=request.data, partial=True
        )
        if not serializer.is_valid():
            return error_response("Update failed.", errors=serializer.errors)
        serializer.save()
        return success_response(
            "Profile updated.", data=UserProfileSerializer(request.user).data
        )


class ActivityHistoryView(APIView):
    """
    GET /api/v1/auth/activity — the caller's own activity history
    (Module 1 — "Activity history").
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["Authentication"])
    def get(self, request):
        qs = ActivityLog.objects.filter(user=request.user).select_related("user")

        action = (request.query_params.get("action") or "").strip()
        if action:
            qs = qs.filter(action=action)

        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs, request)
        return success_response("Activity history retrieved.", data={
            "results": ActivityLogSerializer(page, many=True).data,
            "count": paginator.page.paginator.count,
            "page": paginator.page.number,
            "num_pages": paginator.page.paginator.num_pages,
        })
