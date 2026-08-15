"""
Key moment generation and retrieval routes.
Requires a transcript to exist first (moments are extracted from it).
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status  # type: ignore[import]
from pydantic import BaseModel  # type: ignore[import]

from app.db.mongodb import transcripts_collection, key_moments_collection
from app.models.user import User
from app.api.deps import get_current_user
from app.services.keymoments import generate_key_moments

router = APIRouter()


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