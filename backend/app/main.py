from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from sqlalchemy.orm import Session

from app.core.database import engine, Base, ensure_column
from app.core.config import settings
from app.models import user, role
from app.api.auth import router as auth_router
from app.api.upload import router as upload_router
from app.api.summary import router as summary_router
from app.api.key_moments import router as key_moments_router
from app.api.transcript import router as transcript_router
from app.api.analytics import router as analytics_router
from app.api.search import router as search_router
from app.api.users import router as users_router
from app.api.bookmarks import router as bookmarks_router
from app.api.share import router as share_router
from app.api.admin import router as admin_router
from app.api.learn import router as learn_router
from app.api.classrooms import router as classrooms_router
from app.core.database import SessionLocal
from app.models.role import Role


@asynccontextmanager
async def lifespan(app: FastAPI):

    # Create database tables
    Base.metadata.create_all(bind=engine)

    # Backfill columns added after a table already existed (no Alembic in this project)
    ensure_column("transcripts", "keywords", "JSON")

    db: Session = SessionLocal()

    default_roles = [
        {
            "name": "Creator",
            "description": "Create and manage summarized content."
        },
        {
            "name": "Learner",
            "description": "Consume educational content."
        },
        {
            "name": "Educator",
            "description": "Manage educational resources."
        },
        {
            "name": "Administrator",
            "description": "Manage the platform."
        },
    ]

    for item in default_roles:

        exists = db.query(Role).filter(
            Role.name == item["name"]
        ).first()

        if not exists:

            db.add(
                Role(
                    name=item["name"],
                    description=item["description"]
                )
            )

    db.commit()
    db.close()

    yield


app = FastAPI(
    title="ClipMind AI API",
    description="Backend API",
    version="1.0.0",
    lifespan=lifespan
)

origins = settings.cors_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(summary_router)
app.include_router(key_moments_router)
app.include_router(transcript_router)
app.include_router(analytics_router)
app.include_router(search_router)
app.include_router(users_router)
app.include_router(bookmarks_router)
app.include_router(share_router)
app.include_router(admin_router)
app.include_router(learn_router)
app.include_router(classrooms_router)


@app.get("/")
def home():
    return {
        "message": "Welcome to ClipMind AI Backend!"
    }


@app.get("/health")
def health():
    return {
        "status": "Running"
    }