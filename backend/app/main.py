"""
ClipMind AI — Backend Entry Point
Run locally with:  uvicorn app.main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.db.postgres import Base, engine
from app.db.mongodb import check_mongo_connection

from app.models import user, video, analytics  # noqa: F401
from app.api.v1 import auth, videos, transcripts, summaries, admin, keymoments, analytics, advanced, bookmarks, sharing, materials
@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"Starting {settings.APP_NAME} ({settings.ENVIRONMENT})...")
    Base.metadata.create_all(bind=engine)
    print("[PostgreSQL] Tables verified/created.")
    mongo_ok = await check_mongo_connection()
    print(f"[MongoDB] Connection {'OK' if mongo_ok else 'FAILED — check MONGO_URI in .env'}")
    yield
    print("Shutting down ClipMind AI backend.")


app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered video summarization & key moments detection platform",
    version="0.1.0 (Milestone 1)",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles
import os

os.makedirs(settings.LOCAL_STORAGE_PATH, exist_ok=True)
os.makedirs(settings.THUMBNAIL_STORAGE_PATH, exist_ok=True)
os.makedirs(os.path.join(settings.LOCAL_STORAGE_PATH, "audio"), exist_ok=True)
app.mount("/media/videos", StaticFiles(directory=settings.LOCAL_STORAGE_PATH), name="videos")
app.mount("/media/thumbnails", StaticFiles(directory=settings.THUMBNAIL_STORAGE_PATH), name="thumbnails")
app.mount("/media/audio", StaticFiles(directory=os.path.join(settings.LOCAL_STORAGE_PATH, "audio")), name="audio")
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(videos.router, prefix="/api/v1/videos", tags=["Video Upload"])
app.include_router(transcripts.router, prefix="/api/v1/transcripts", tags=["Transcripts"])
app.include_router(summaries.router, prefix="/api/v1/summaries", tags=["Summaries"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(keymoments.router, prefix="/api/v1/keymoments", tags=["Key Moments"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(advanced.router, prefix="/api/v1/advanced", tags=["Advanced Features"])
app.include_router(bookmarks.router, prefix="/api/v1/bookmarks", tags=["Bookmarks"])
app.include_router(sharing.router, prefix="/api/v1/sharing", tags=["Sharing"])
app.include_router(materials.router, prefix="/api/v1/materials", tags=["Learning Materials"])
@app.get("/")
def root():
    return {
        "message": "ClipMind AI backend is running.",
        "milestone": "Milestone 1 — Project Initialization & Design",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}