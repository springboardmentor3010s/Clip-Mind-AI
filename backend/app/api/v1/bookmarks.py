"""
Bookmark routes — lets Learners save summaries/highlights for later.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.db.mongodb import mongo_db
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter()
bookmarks_collection = mongo_db["bookmarks"]


class BookmarkRequest(BaseModel):
    video_id: str
    video_title: str
    note: str = ""


@router.post("/add")
async def add_bookmark(payload: BookmarkRequest, current_user: User = Depends(get_current_user)):
    existing = await bookmarks_collection.find_one({
        "video_id": payload.video_id, "user_id": str(current_user.user_id)
    })
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already bookmarked.")

    doc = {
        "video_id": payload.video_id,
        "video_title": payload.video_title,
        "user_id": str(current_user.user_id),
        "note": payload.note,
        "created_at": datetime.utcnow(),
    }
    await bookmarks_collection.insert_one(doc)
    return {"message": "Bookmarked."}


@router.get("/my-bookmarks")
async def get_my_bookmarks(current_user: User = Depends(get_current_user)):
    bookmarks = []
    cursor = bookmarks_collection.find({"user_id": str(current_user.user_id)}).sort("created_at", -1)
    async for doc in cursor:
        bookmarks.append({
            "video_id": doc["video_id"],
            "video_title": doc["video_title"],
            "note": doc.get("note", ""),
            "created_at": doc["created_at"],
        })
    return {"bookmarks": bookmarks}


@router.delete("/{video_id}")
async def remove_bookmark(video_id: str, current_user: User = Depends(get_current_user)):
    result = await bookmarks_collection.delete_one({
        "video_id": video_id, "user_id": str(current_user.user_id)
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bookmark not found.")
    return {"message": "Bookmark removed."}