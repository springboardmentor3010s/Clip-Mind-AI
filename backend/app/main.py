from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import Base, engine
from app.routers import auth, video, creator, educator, admin, learner

# Create tables in the local SQLite database file if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ClipMind AI Core", docs_url="/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "mode": "standalone-sqlite"}

app.include_router(auth.router, prefix="/api/v1")
app.include_router(video.router, prefix="/api/v1")
app.include_router(creator.router, prefix="/api/v1")
app.include_router(educator.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(learner.router, prefix="/api/v1")