from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from routes.auth_routes import router as auth_router
from routes.upload_routes import router as upload_router
from routes.process_routes import router as process_router

app = FastAPI(
    title="ClipMind AI API",
    version="1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3003",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3003",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(process_router)

@app.get("/")
def home():
    return {"message": "Welcome to ClipMind AI Backend"}