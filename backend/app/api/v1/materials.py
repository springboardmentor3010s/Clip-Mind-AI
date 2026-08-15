"""
Learning materials routes — lets Educators turn a video's summary and
transcript into structured study material (key points, Q&A, keywords)
for sharing with students.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.db.mongodb import transcripts_collection, summaries_collection, mongo_db
from app.models.user import User
from app.api.deps import get_current_user
from app.services.summarization import bulletify_summary
from app.services.qagen import generate_qa_pairs
from app.services.keywords import extract_keywords

router = APIRouter()
materials_collection = mongo_db["learning_materials"]


class GenerateMaterialRequest(BaseModel):
    video_id: str


@router.post("/generate")
async def generate_learning_material(
    payload: GenerateMaterialRequest,
    current_user: User = Depends(get_current_user),
):
    if current_user.role.value != "educator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Educators can create learning materials.",
        )

    summary_doc = await summaries_collection.find_one({
        "video_id": payload.video_id, "user_id": str(current_user.user_id)
    })
    transcript_doc = await transcripts_collection.find_one({
        "video_id": payload.video_id, "user_id": str(current_user.user_id)
    })

    if not summary_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No summary found for this video. Please generate a summary first.",
        )

    key_points = bulletify_summary(summary_doc["detailed_summary"])
    qa_pairs = generate_qa_pairs(summary_doc["detailed_summary"])
    keywords = extract_keywords(transcript_doc["text"]) if transcript_doc else []

    doc = {
        "video_id": payload.video_id,
        "user_id": str(current_user.user_id),
        "video_title": summary_doc.get("video_title", "Video"),
        "key_points": key_points,
        "qa_pairs": qa_pairs,
        "keywords": keywords,
        "created_at": datetime.utcnow(),
    }

    await materials_collection.delete_many({"video_id": payload.video_id, "user_id": str(current_user.user_id)})
    await materials_collection.insert_one(doc)

    doc["_id"] = None
    return doc


@router.get("/{video_id}")
async def get_learning_material(video_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role.value == "learner":
        doc = await materials_collection.find_one({"video_id": video_id})
    else:
        doc = await materials_collection.find_one({"video_id": video_id, "user_id": str(current_user.user_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No learning material found for this video.")
    doc["_id"] = str(doc["_id"])
    return doc