"""
URL patterns for the accounts app.
All routes are mounted at /api/v1/auth/ in config/urls.py.
"""
from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    TokenRefreshView,
    ForgotPasswordView,
    ResetPasswordView,
    ChangePasswordView,
    ProfileView,
    ActivityHistoryView,
)

urlpatterns = [
    path("register", RegisterView.as_view(), name="auth-register"),
    path("login", LoginView.as_view(), name="auth-login"),
    path("logout", LogoutView.as_view(), name="auth-logout"),
    path("refresh", TokenRefreshView.as_view(), name="auth-refresh"),
    path("forgot-password", ForgotPasswordView.as_view(), name="auth-forgot-password"),
    path("reset-password", ResetPasswordView.as_view(), name="auth-reset-password"),
    path("change-password", ChangePasswordView.as_view(), name="auth-change-password"),
    path("profile", ProfileView.as_view(), name="auth-profile"),
    path("activity", ActivityHistoryView.as_view(), name="auth-activity"),
]
