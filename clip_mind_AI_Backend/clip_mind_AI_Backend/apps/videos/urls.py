"""
URL patterns for the videos app (mounted at /api/v1/videos/).

Ordering matters: literal paths such as "library", "search" and "bookmarks"
are declared BEFORE the "<uuid:pk>" catch-all so they are never swallowed by
the detail route.
"""
from django.urls import path
from .views import (
    VideoUploadView,
    YouTubeURLView,
    VideoListView,
    VideoLibraryView,
    VideoDetailView,
    VideoProgressView,
    VideoTranslateView,
    TranscriptEditView,
    VideoShareView,
    PublicSharedVideoView,
    VideoViewEventView,
    BookmarkListView,
    BookmarkDetailView,
    LearningHistoryView,
    TranscriptSearchView,
    LearningMaterialListView,
    LearningMaterialDetailView,
)

urlpatterns = [
    # Collection-level (literal paths first)
    path("", VideoListView.as_view(), name="video-list"),
    path("upload", VideoUploadView.as_view(), name="video-upload"),
    path("youtube", YouTubeURLView.as_view(), name="video-youtube"),
    path("library", VideoLibraryView.as_view(), name="video-library"),
    path("search", TranscriptSearchView.as_view(), name="video-search"),
    path("history", LearningHistoryView.as_view(), name="learning-history"),

    path("bookmarks", BookmarkListView.as_view(), name="bookmark-list"),
    path("bookmarks/<uuid:pk>", BookmarkDetailView.as_view(), name="bookmark-detail"),

    path("materials", LearningMaterialListView.as_view(), name="material-list"),
    path("materials/<uuid:pk>", LearningMaterialDetailView.as_view(), name="material-detail"),

    # Public share (unauthenticated)
    path("shared/<str:token>", PublicSharedVideoView.as_view(), name="video-shared"),

    # Object-level
    path("<uuid:pk>", VideoDetailView.as_view(), name="video-detail"),
    path("<uuid:pk>/progress", VideoProgressView.as_view(), name="video-progress"),
    path("<uuid:pk>/translate", VideoTranslateView.as_view(), name="video-translate"),
    path("<uuid:pk>/transcript", TranscriptEditView.as_view(), name="video-transcript-edit"),
    path("<uuid:pk>/share", VideoShareView.as_view(), name="video-share"),
    path("<uuid:pk>/view", VideoViewEventView.as_view(), name="video-view-event"),
]
