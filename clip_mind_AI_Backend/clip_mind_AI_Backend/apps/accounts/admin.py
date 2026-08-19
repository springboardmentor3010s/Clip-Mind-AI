"""
Admin configuration for ClipMind AI User model.
"""

from django.contrib import admin

from .models import ContactMessage


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("subject", "name", "email", "is_read", "email_sent", "created_at")
    list_filter = ("is_read", "email_sent", "created_at")
    search_fields = ("name", "email", "subject", "message")
    readonly_fields = ("id", "ip_address", "created_at")
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):

    list_display = (
        "email",
        "first_name",
        "last_name",
        "role",
        "is_verified",
        "is_active",
        "is_staff",
        "created_at",
    )

    list_filter = (
        "role",
        "is_verified",
        "is_active",
        "is_staff",
        "login_provider",
    )

    search_fields = (
        "email",
        "first_name",
        "last_name",
    )

    ordering = ("-created_at",)

    readonly_fields = (
        "id",
        "created_at",
        "updated_at",
        "deleted_at",
        "last_login",
    )

    fieldsets = (
        (
            "Account",
            {
                "fields": (
                    "id",
                    "email",
                    "password",
                )
            },
        ),
        (
            "Personal Information",
            {
                "fields": (
                    "first_name",
                    "last_name",
                    "profile_image",
                )
            },
        ),
        (
            "Authentication",
            {
                "fields": (
                    "login_provider",
                    "is_verified",
                    "last_login_ip",
                    "last_login_device",
                )
            },
        ),
        (
            "Permissions",
            {
                "fields": (
                    "role",
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        (
            "Dates",
            {
                "fields": (
                    "last_login",
                    "created_at",
                    "updated_at",
                    "deleted_at",
                )
            },
        ),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "first_name",
                    "last_name",
                    "password1",
                    "password2",
                    "role",
                ),
            },
        ),
    )