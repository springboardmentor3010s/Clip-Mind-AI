"""
Key moment generation and retrieval routes.
Requires a transcript to exist first (moments are extracted from it).
Also supports OpenCV-based visual scene-change detection directly
from the video file, independent of the transcript.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status  # type: ignore[import]
from pydantic import BaseModel  # type: ignore[import]
from sqlalchemy.orm import Session  # type: ignore[import]

from app.db.postgres import get_db
from app.db.mongodb import transcripts_collection, key_moments_collection, mongo_db
from app.models.user import User
from app.models.video import Video
from app.api.deps import get_current_user
from app.services.keymoments import generate_key_moments

router = APIRouter()
scene_moments_collection = mongo_db["scene_moments"]


class GenerateKeyMomentsRequest(BaseModel):
    video_id: str


@router.post("/generate")
async def generate_moments(
    payload: GenerateKeyMomentsRequest,
    current_user: User = Depends(get_current_user),
):
    if current_user.role.value == "learner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Learners have view-only access and cannot generate key moments.",
        )
    transcript_doc = await transcripts_collection.find_one({
        "video_id": payload.video_id, "user_id": str(current_user.user_id)
    })
    if not transcript_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No transcript found for this video. Please generate a transcript first.",
        )

    moments = generate_key_moments(transcript_doc["segments"])

    doc = {
        "video_id": payload.video_id,
        "user_id": str(current_user.user_id),
        "video_title": transcript_doc.get("video_title", "Video"),
        "moments": moments,
        "created_at": datetime.utcnow(),
    }

    await key_moments_collection.delete_many({"video_id": payload.video_id, "user_id": str(current_user.user_id)})
    await key_moments_collection.insert_one(doc)

    doc["_id"] = None
    return doc


@router.get("/{video_id}")
async def get_moments(video_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role.value == "learner":
        doc = await key_moments_collection.find_one({"video_id": video_id})
    else:
        doc = await key_moments_collection.find_one({"video_id": video_id, "user_id": str(current_user.user_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No key moments found for this video.")
    doc["_id"] = str(doc["_id"])
    return doc


# ── Visual Scene Detection (OpenCV) ─────────────────────────────

class GenerateVisualScenesRequest(BaseModel):
    video_id: str


@router.post("/generate-visual")
async def generate_visual_scenes(
    payload: GenerateVisualScenesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.value == "learner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Learners have view-only access and cannot generate visual scenes.",
        )

    video = db.query(Video).filter(
        Video.video_id == payload.video_id, Video.user_id == current_user.user_id
    ).first()
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found.")
    if not video.file_path:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Video file not found on server.")

    from app.services.scene_detection import detect_scene_changes
    scenes = detect_scene_changes(video.file_path)

    doc = {
        "video_id": payload.video_id,
        "user_id": str(current_user.user_id),
        "video_title": video.title,
        "scenes": scenes,
        "created_at": datetime.utcnow(),
    }

    await scene_moments_collection.delete_many({"video_id": payload.video_id, "user_id": str(current_user.user_id)})
    await scene_moments_collection.insert_one(doc)

    doc["_id"] = None
    return doc


@router.get("/{video_id}/visual")
async def get_visual_scenes(video_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role.value == "learner":
        doc = await scene_moments_collection.find_one({"video_id": video_id})
    else:
        doc = await scene_moments_collection.find_one({"video_id": video_id, "user_id": str(current_user.user_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No visual scenes found for this video.")
    doc["_id"] = str(doc["_id"])
    return doc