"""
ClipMind AI - Main FastAPI Application Entry Point.
"""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.database.database import engine, Base, SessionLocal
from app.models import *  # noqa: F401,F403 - Import to register models

from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.admin import router as admin_router
from app.routers.admin_ops import router as admin_ops_router
from app.routers.video_router import router as video_router
from app.routers.transcript_router import router as transcript_router, simple_router as transcript_simple_router
from app.routers.summary_router import router as summary_router
from app.routers.key_moment_router import router as key_moment_router
from app.routers.analytics_router import router as analytics_router
from app.routers.bookmarks import router as bookmark_router
from app.routers.watch_history_router import router as watch_history_router
from app.routers.quiz_router import router as quiz_router
from app.routers.keyword_router import router as keyword_router
from app.routers.reports import router as reports_router
from app.routers.learning_material_router import router as learning_material_router
from app.routers.learning_material_share_router import (
    router as learning_material_share_router,
    public_router as learning_material_share_public_router,
)
from app.routers.summary_share_router import router as summary_share_router, public_router as summary_share_public_router
from app.routers.educator_router import router as educator_router

# Create database tables
Base.metadata.create_all(bind=engine)


def initialize_database():
    """Initialize database with default data."""
    from sqlalchemy.orm import Session
    from app.models.role import Role

    db = SessionLocal()
    try:
        # Check if roles already exist
        existing_roles = db.query(Role).count()
        if existing_roles == 0:
            # Insert default roles
            default_roles = [
                Role(name="Administrator", description="Full system access and management"),
                Role(name="Content Creator", description="Can upload and manage video content"),
                Role(name="Educator", description="Can access transcripts and summaries"),
                Role(name="Learner", description="Can view and interact with content"),
            ]
            db.add_all(default_roles)
            db.commit()
            print("✓ Database initialized with default roles")
        else:
            print(f"✓ Database already contains {existing_roles} roles")
    except Exception as e:
        print(f"! Warning: Could not initialize database: {e}")
        db.rollback()
    finally:
        db.close()

    # Self-healing migration: ensure new columns used by Learner features exist.
    # `create_all` only creates missing tables, so columns added to existing
    # tables (e.g. videos.is_published) must be applied here as well.
    from sqlalchemy import text
    try:
        with engine.connect() as conn:
            conn.execute(text(
                "ALTER TABLE videos ADD COLUMN IF NOT EXISTS "
                "is_published BOOLEAN DEFAULT TRUE NOT NULL"
            ))
            conn.commit()
            print("✓ videos.is_published column ensured")
    except Exception as e:
        print(f"! Warning: Could not apply is_published migration: {e}")
        try:
            with engine.connect() as conn:
                conn.rollback()
        except Exception:
            pass


def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="""
        # ClipMind AI API

        A video intelligence platform that transforms video content into
        searchable, summarized, and actionable knowledge.

        ## Features (Phase 1)

        - **Authentication**: Register, Login, JWT-based auth
        - **User Management**: Profile management
        - **Role-Based Access Control**: Administrator, Content Creator, Educator, Learner
        - **Admin Panel**: User management, role management

        ## Authentication

        Use the `/api/auth/login` endpoint to obtain a JWT token.
        Include the token in the `Authorization` header as `Bearer <token>`.
        """,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # CORS Middleware
    if settings.BACKEND_CORS_ORIGINS:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    # Serve uploaded files statically
    upload_dir = settings.UPLOAD_DIR
    if os.path.exists(upload_dir):
        app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

    # Register routers
    app.include_router(auth_router)
    app.include_router(users_router)
    app.include_router(admin_router)
    app.include_router(admin_ops_router)
    app.include_router(video_router)
    app.include_router(transcript_router)
    app.include_router(transcript_simple_router)
    app.include_router(summary_router)
    app.include_router(key_moment_router)
    app.include_router(analytics_router)
    app.include_router(bookmark_router)
    app.include_router(watch_history_router)
    app.include_router(quiz_router)
    app.include_router(keyword_router)
    app.include_router(reports_router)
    app.include_router(learning_material_router)
    app.include_router(learning_material_share_router)
    app.include_router(learning_material_share_public_router)
    app.include_router(summary_share_router)
    app.include_router(summary_share_public_router)
    app.include_router(educator_router)

    @app.get("/", include_in_schema=False)
    def root():
        """Redirect to API docs."""
        return RedirectResponse(url="/docs")

    @app.get("/health", tags=["Health"])
    def health_check():
        """Health check endpoint."""
        return {
            "status": "healthy",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
        }

    # Initialize database on startup
    @app.on_event("startup")
    def startup_event():
        initialize_database()

    return app


app = create_application()
