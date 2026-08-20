"""
Aggregates all v1 routers so main.py only imports one object.
"""
from fastapi import APIRouter

from app.api.v1 import auth, users, videos, transcripts, summaries, key_moments, analytics, bookmarks, admin, classrooms

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(videos.router)
api_router.include_router(transcripts.router)
api_router.include_router(summaries.router)
api_router.include_router(key_moments.router)
api_router.include_router(analytics.router)
api_router.include_router(bookmarks.router)
api_router.include_router(admin.router)
api_router.include_router(classrooms.router)