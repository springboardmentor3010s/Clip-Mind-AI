"""
ClipMind AI — FastAPI application entrypoint.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine
from app.api.v1.router import api_router

# Import models so SQLAlchemy's metadata knows about them before create_all
from app import models  # noqa: F401


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        description="AI-powered video summarization & key moments detection platform.",
        version="0.1.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router)

    @app.on_event("startup")
    def on_startup():
        # For quick local dev only — use Alembic migrations in real environments.
        Base.metadata.create_all(bind=engine)

    @app.get("/health", tags=["Health"])
    def health_check():
        return {"status": "ok", "app": settings.APP_NAME, "environment": settings.ENVIRONMENT}

    return app


app = create_app()
