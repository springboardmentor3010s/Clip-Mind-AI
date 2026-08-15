"""
Sharing routes — lets Educators and Admins generate a shareable link
for a video (video + transcript + summary + key moments), viewable
without login (for students). Each view increments a view counter
that feeds into Classroom Analytics.
"""

import os
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.postgres import get_db
from app.db.mongodb import transcripts_collection, summaries_collection, key_moments_collection, mongo_db
from app.models.video import Video
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter()
shares_collection = mongo_db["shares"]


class CreateShareRequest(BaseModel):
    video_id: str


@router.post("/generate")
async def create_share_link(
    payload: CreateShareRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.value not in ("educator", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Educators and Admins can share content.",
        )

    video = db.query(Video).filter(
        Video.video_id == payload.video_id, Video.user_id == current_user.user_id
    ).first()
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found.")

    summary_doc = await summaries_collection.find_one({
        "video_id": payload.video_id, "user_id": str(current_user.user_id)
    })
    if not summary_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No summary found for this video. Please generate a summary first.",
        )

    transcript_doc = await transcripts_collection.find_one({
        "video_id": payload.video_id, "user_id": str(current_user.user_id)
    })
    moments_doc = await key_moments_collection.find_one({
        "video_id": payload.video_id, "user_id": str(current_user.user_id)
    })

    share_id = uuid.uuid4().hex[:10]

    doc = {
        "share_id": share_id,
        "video_id": payload.video_id,
        "user_id": str(current_user.user_id),
        "video_title": video.title,
        "video_url": f"http://localhost:8000/media/videos/{os.path.basename(video.file_path)}" if video.file_path else None,
        "thumbnail_url": f"http://localhost:8000/media/thumbnails/{os.path.basename(video.thumbnail_url)}" if video.thumbnail_url else None,
        "duration_seconds": video.duration_seconds,
        "short_summary": summary_doc.get("short_summary"),
        "detailed_summary": summary_doc.get("detailed_summary"),
        "segments": transcript_doc.get("segments") if transcript_doc else [],
        "moments": moments_doc.get("moments") if moments_doc else [],
        "views": 0,
        "created_at": datetime.utcnow(),
    }

    await shares_collection.insert_one(doc)

    return {
        "share_id": share_id,
        "share_url": f"http://localhost:3000/shared/{share_id}",
    }


@router.get("/view/{share_id}")
async def view_shared_content(share_id: str):
    doc = await shares_collection.find_one({"share_id": share_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="This share link is invalid or has expired.")

    # Count this as a view — feeds into the Educator's Classroom Analytics
    await shares_collection.update_one({"share_id": share_id}, {"$inc": {"views": 1}})

    return {
        "video_id": doc.get("video_id"),
        "video_title": doc.get("video_title"),
        "video_url": doc.get("video_url"),
        "thumbnail_url": doc.get("thumbnail_url"),
        "duration_seconds": doc.get("duration_seconds"),
        "short_summary": doc.get("short_summary"),
        "detailed_summary": doc.get("detailed_summary"),
        "segments": doc.get("segments", []),
        "moments": doc.get("moments", []),
        "created_at": doc.get("created_at"),
    }


@router.get("/my-shares")
async def get_my_shares(current_user: User = Depends(get_current_user)):
    shares = []
    cursor = shares_collection.find({"user_id": str(current_user.user_id)}).sort("created_at", -1)
    async for doc in cursor:
        shares.append({
            "share_id": doc["share_id"],
            "video_id": doc["video_id"],
            "video_title": doc["video_title"],
            "share_url": f"http://localhost:3000/shared/{doc['share_id']}",
            "views": doc.get("views", 0),
            "created_at": doc["created_at"],
        })
    return {"shares": shares}