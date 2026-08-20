"""
Routers package.
"""
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.admin import router as admin_router
from app.routers.video_router import router as video_router
from app.routers.transcript_router import router as transcript_router
from app.routers.summary_router import router as summary_router
from app.routers.key_moment_router import router as key_moment_router
from app.routers.analytics_router import router as analytics_router
from app.routers.bookmarks import router as bookmark_router


__all__ = [
    "auth_router",
    "users_router",
    "admin_router",
    "video_router",
    "transcript_router",
    "summary_router",
    "key_moment_router",
    "analytics_router",
    "bookmark_router",
]
