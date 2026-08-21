from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine

from app.models import (
    User,
    Video,
    Classroom,
    ClassroomMember,
)

from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.routes.video import router as video_router
from app.routes.bookmarks import router as bookmark_router
from app.routes.classroom import router as classroom_router
from app.routes.summary_share import router as summary_share_router
from app.routes.admin import router as admin_router


# =========================================================
# CREATE DATABASE TABLES
# =========================================================

print(Base.metadata.tables.keys())

Base.metadata.create_all(bind=engine)


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="ClipMind AI Backend"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# ROUTERS
# =========================================================

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(video_router)
app.include_router(bookmark_router)
app.include_router(classroom_router)
app.include_router(summary_share_router)
app.include_router(admin_router)


# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():
    return {
        "message": "ClipMind AI Backend is running!"
    }