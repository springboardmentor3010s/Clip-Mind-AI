from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database.base import Base
from app.database.postgres import engine

from app.models.user import User
from app.models.video import Video
from app.models.course import Course

from app.api.auth.routes import router as auth_router
from app.api.creator.routes import router as creator_router
from app.api.educator.routes import router as educator_router
from app.models.enrollment import Enrollment
from app.api.learner.routes import router as learner_router
from app.api.enrollment.routes import router as enrollment_router
from app.models.transcript import Transcript
from app.api.transcript.routes import router as transcript_router
from app.api.educator.routes import router as educator_router

app = FastAPI(
    title="ClipMind AI",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads",
)

Base.metadata.create_all(bind=engine)

app.include_router(auth_router)
app.include_router(creator_router)
app.include_router(educator_router)
app.include_router(learner_router)
app.include_router(enrollment_router)
app.include_router(transcript_router)
app.include_router(educator_router)

@app.get("/")
def home():
    return {
        "message": "Welcome to ClipMind AI Backend 🚀"
    }


@app.get("/health")
def health():
    return {
        "status": "Server Running Successfully"
    }