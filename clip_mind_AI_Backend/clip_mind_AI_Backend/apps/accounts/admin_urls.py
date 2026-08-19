"""
Administrator API routes (mounted at /api/v1/admin/).
Every view enforces core.permissions.IsAdmin.
"""
from django.urls import path
from .admin_views import (
    AdminStatsView,
    AdminUserListView,
    AdminUserDetailView,
    AdminActivityView,
    AdminContentView,
    AdminJobsView,
    AdminStorageView,
    AdminAuditLogView,
    AdminSettingsView,
    AdminContactMessageView,
)

urlpatterns = [
    path("stats", AdminStatsView.as_view(), name="admin-stats"),
    path("users", AdminUserListView.as_view(), name="admin-users"),
    path("users/<uuid:pk>", AdminUserDetailView.as_view(), name="admin-user-detail"),
    path("activity", AdminActivityView.as_view(), name="admin-activity"),
    path("content", AdminContentView.as_view(), name="admin-content"),
    path("jobs", AdminJobsView.as_view(), name="admin-jobs"),
    path("storage", AdminStorageView.as_view(), name="admin-storage"),
    path("audit-logs", AdminAuditLogView.as_view(), name="admin-audit-logs"),
    path("settings", AdminSettingsView.as_view(), name="admin-settings"),
    path("contact-messages", AdminContactMessageView.as_view(), name="admin-contact-messages"),
]
