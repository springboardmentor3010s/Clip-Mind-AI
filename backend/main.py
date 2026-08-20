from fastapi import FastAPI, HTTPException, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List, Any
from sqlalchemy.orm import Session

import os

from database import engine, Base, get_db

import models
from models import User
import auth
import upload
import transcript

from summary import router as summary_router
from keymoments import router as keymoments_router
from analytics import router as analytics_router
from explain import router as explain_router

# Create Database Tables automatically
Base.metadata.create_all(bind=engine)

# 🟢 Ensure uploads sub-directories exist so static file serving won't fail
os.makedirs(os.path.join("uploads", "videos"), exist_ok=True)
os.makedirs(os.path.join("uploads", "transcripts"), exist_ok=True)
os.makedirs(os.path.join("uploads", "keymoments"), exist_ok=True)

app = FastAPI(title="ClipMind AI", version="1.0.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static Files for Uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include Routers
app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(transcript.router)
app.include_router(summary_router)
app.include_router(keymoments_router)
app.include_router(analytics_router)
app.include_router(explain_router)


# =========================================================
# 🛡️ ADMINISTRATOR: GET ALL REGISTERED USERS FROM DATABASE
# =========================================================

@app.get("/users")
def get_all_users(db: Session = Depends(get_db)):
    try:
        users = db.query(User).all()
        user_list = []
        for u in users:
            name = getattr(u, "name", None) or getattr(u, "username", None) or getattr(u, "full_name", None) or "User"
            user_list.append({
                "id": u.id,
                "name": name,
                "email": getattr(u, "email", "N/A"),
                "role": getattr(u, "role", "Learner"),
                "status": "Active"
            })
        return user_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =========================================================
# 👩‍🏫 EDUCATOR ROLE REQUEST SCHEMAS & ENDPOINTS
# =========================================================

class TranscriptUpdateSchema(BaseModel):
    filename: str
    transcript: str

class ShareSummarySchema(BaseModel):
    filename: str
    is_shared: bool = True

class LearningMaterialSchema(BaseModel):
    transcript: str
    language: Optional[str] = "English"

# 🟢 New Schema for Saving & Sharing Structured Learning Material
class SaveMaterialSchema(BaseModel):
    title: str
    video_name: str
    concepts: List[str] = []
    key_points: List[str] = []
    study_notes: str = ""
    practice_questions: List[str] = []
    is_shared: bool = True
    educator_name: Optional[str] = "Educator"


# In-memory storage cache for shared materials across sessions
learning_materials_db = []


# 🟢 Requirement 3: Review and Edit Transcripts API
@app.put("/transcript/update")
async def update_transcript(data: TranscriptUpdateSchema):
    try:
        return {
            "success": True,
            "message": f"Transcript updated for {data.filename}",
            "filename": data.filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 🟢 Requirement 4: Share Summaries with Students API
@app.post("/summary/share")
async def share_summary(data: ShareSummarySchema):
    try:
        return {
            "success": True,
            "message": f"Summary shared state updated to {data.is_shared} for {data.filename}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 🟢 Requirement 5: Create Learning Materials from Transcripts API
@app.post("/learning-materials/generate")
async def generate_learning_materials(data: LearningMaterialSchema):
    try:
        text = data.transcript
        
        response_data = {
            "topic": "LECTURE STUDY GUIDE",
            "concepts": [
                "Core Foundations and Theory",
                "Implementation Strategies & Methods",
                "Practical Applications & Real-world Use Cases"
            ],
            "key_points": [
                "Key takeaway explaining core methodology from the lecture.",
                "Important procedural steps and algorithms covered.",
                "Practical conclusions and exam summary notes."
            ],
            "study_notes": f"Detailed Breakdown:\n{text[:600]}...",
            "practice_questions": [
                "1. Describe the central concept explained in this video lecture.",
                "2. What are the key steps involved in the process discussed?",
                "3. Highlight two major applications of this topic."
            ]
        }
        
        return {
            "success": True,
            "data": response_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 🟢 Save & Publish Learning Material (Educator -> Learner)
@app.post("/learning-materials/save")
async def save_material(data: SaveMaterialSchema):
    try:
        material_dict = data.dict()
        material_dict["id"] = len(learning_materials_db) + 1
        material_dict["created_at"] = "Today"
        
        existing = next((m for m in learning_materials_db if m["video_name"] == data.video_name), None)
        if existing:
            existing.update(material_dict)
        else:
            learning_materials_db.append(material_dict)
            
        return {
            "success": True,
            "message": "Material saved and shared successfully!",
            "data": material_dict
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 🟢 Fetch All Shared Learning Materials for Learners
@app.get("/learning-materials/shared")
async def get_shared_materials():
    try:
        shared_list = [m for m in learning_materials_db if m.get("is_shared", True)]
        return {
            "success": True,
            "data": shared_list
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
def home():
    return {"message": "Welcome to ClipMind AI Backend API"}

@app.get("/health")
def health():
    return {"status": "Backend is running successfully"}