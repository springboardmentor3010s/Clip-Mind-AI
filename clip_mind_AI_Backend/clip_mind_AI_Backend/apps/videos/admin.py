from django.contrib import admin

from .models import (
    Video, VideoTranslation, VideoShare, VideoView, Bookmark, LearningHistory,
)


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "status", "progress", "duration_seconds", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("title", "user__email", "youtube_id", "source_url")
    readonly_fields = ("id", "created_at", "updated_at")
    raw_id_fields = ("user",)


@admin.register(VideoShare)
class VideoShareAdmin(admin.ModelAdmin):
    list_display = ("video", "owner", "is_public", "created_at")
    list_filter = ("is_public", "created_at")
    search_fields = ("video__title", "owner__email", "token")
    raw_id_fields = ("video", "owner")


@admin.register(VideoView)
class VideoViewAdmin(admin.ModelAdmin):
    list_display = ("video", "user", "watch_seconds", "created_at")
    list_filter = ("created_at",)
    raw_id_fields = ("video", "user")


@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    list_display = ("video", "user", "timestamp_seconds", "created_at")
    search_fields = ("video__title", "user__email")
    raw_id_fields = ("video", "user")


@admin.register(LearningHistory)
class LearningHistoryAdmin(admin.ModelAdmin):
    list_display = ("video", "user", "view_count", "completed", "last_viewed_at")
    list_filter = ("completed",)
    raw_id_fields = ("video", "user")


admin.site.register(VideoTranslation)
