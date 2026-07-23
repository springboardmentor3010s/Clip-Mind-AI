"""
Bookmarks Module.

Lets a user save a video, one of its summary variants, or a specific
highlight (key moment) for later. Each bookmark stores a self-contained
snapshot of the target content (title/text/timestamps) at save time, so
the Bookmarks page can render a full list in one read without joining
back across Postgres and two Mongo collections per row, and a bookmark
still displays correctly even if the underlying summary/key-moments are
later regenerated.

Access note: bookmarking reuses get_video_or_404 with require_owner=False,
so any video you own, or any video its owner has published to the content
library, can be bookmarked.
"""
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.mongo import bookmarks_collection, key_moments_collection, summaries_collection
from app.models.user import User
from app.schemas.bookmark import BookmarkCreate
from app.services.video_service import get_video_or_404


def _target_key(owner_id: str, payload: BookmarkCreate) -> str:
    if payload.type == "video":
        return f"{owner_id}:video:{payload.video_id}"
    if payload.type == "summary":
        return f"{owner_id}:summary:{payload.video_id}:{payload.variant}"
    return f"{owner_id}:highlight:{payload.video_id}:{payload.start}"


async def create_bookmark(db: Session, payload: BookmarkCreate, current_user: User) -> dict:
    video = get_video_or_404(db, payload.video_id, current_user, require_owner=False)

    key = _target_key(str(current_user.id), payload)
    existing = await bookmarks_collection.find_one({"target_key": key})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already bookmarked.")

    doc = {
        "id": str(uuid.uuid4()),
        "target_key": key,
        "owner_id": str(current_user.id),
        "video_id": str(payload.video_id),
        "video_title": video.title or video.filename,
        "type": payload.type,
        "variant": None,
        "start": None,
        "end": None,
        "text": None,
        "keywords": [],
        "created_at": datetime.now(timezone.utc),
    }

    if payload.type == "summary":
        summary = await summaries_collection.find_one({"video_id": str(payload.video_id)})
        if not summary:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No summary found for this video yet. Generate it first.",
            )
        doc["variant"] = payload.variant
        doc["text"] = summary.get("short_summary" if payload.variant == "short" else "detailed_summary", "")

    elif payload.type == "highlight":
        moments = await key_moments_collection.find_one({"video_id": str(payload.video_id)})
        highlight = next(
            (h for h in (moments or {}).get("highlights", []) if h["start"] == payload.start),
            None,
        )
        if not highlight:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Highlight not found for this video. Generate key moments first.",
            )
        doc["start"] = highlight["start"]
        doc["end"] = highlight["end"]
        doc["text"] = highlight["text"]
        doc["keywords"] = highlight.get("keywords", [])

    await bookmarks_collection.insert_one(doc)
    doc.pop("_id", None)
    doc.pop("target_key", None)
    return doc


async def list_bookmarks(current_user: User, video_id: uuid.UUID | None = None) -> list[dict]:
    query: dict = {"owner_id": str(current_user.id)}
    if video_id:
        query["video_id"] = str(video_id)

    results = []
    async for doc in bookmarks_collection.find(query).sort("created_at", -1):
        doc.pop("_id", None)
        doc.pop("target_key", None)
        results.append(doc)
    return results


async def delete_bookmark(bookmark_id: str, current_user: User) -> None:
    result = await bookmarks_collection.delete_one({"id": bookmark_id, "owner_id": str(current_user.id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bookmark not found.")