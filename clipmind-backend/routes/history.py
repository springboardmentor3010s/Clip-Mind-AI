import os
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from models.database import get_db
from models.db_models import Video, User
from services import activity_service
from routes.auth import get_current_user

router = APIRouter(tags=["history"])

_RANGE_WINDOWS_SECONDS = {
    "24h": 86400,
    "7d": 604800,
    "30d": 2592000,
}


def _parse_created_at(value: str) -> datetime:
    try:
        dt = datetime.fromisoformat(
            value.replace("Z", "+00:00")
        )

        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)

        return dt

    except ValueError:
        return datetime.now(timezone.utc)


@router.get("/history")
def list_history(
    query: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    range: Optional[str] = Query(default=None),  # noqa: A002
    sort: Optional[str] = Query(default="newest"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    videos = (
        db.query(Video)
        .filter(Video.user_id == current_user.id)
        .order_by(Video.created_at.desc())
        .all()
    )

    records = [v.to_record() for v in videos]

    # --- text search across title, file name, topics and transcript text ---
    if query and query.strip():
        q = query.strip().lower()

        def matches(r: dict) -> bool:
            if (
                q in r["title"].lower()
                or q in r["fileName"].lower()
            ):
                return True

            topics = (
                (r.get("summary") or {}).get("topics")
                or []
            )

            if any(q in t.lower() for t in topics):
                return True

            if any(
                q in seg["text"].lower()
                for seg in r.get("transcript") or []
            ):
                return True

            return False

        records = [
            r for r in records
            if matches(r)
        ]

    # --- status filter ---
    if status and status != "All":
        records = [
            r for r in records
            if r["status"] == status
        ]

    # --- date range filter ---
    if range and range != "all":
        window = _RANGE_WINDOWS_SECONDS.get(range)

        if window:
            now = datetime.now(timezone.utc)

            records = [
                r
                for r in records
                if (
                    now
                    - _parse_created_at(r["createdAt"])
                ).total_seconds()
                <= window
            ]

    # --- sort ---
    if sort == "oldest":
        records.sort(
            key=lambda r: r["createdAt"]
        )

    elif sort == "longest":
        records.sort(
            key=lambda r: r["durationSeconds"],
            reverse=True,
        )

    elif sort == "title":
        records.sort(
            key=lambda r: r["title"].lower()
        )

    else:  # newest
        records.sort(
            key=lambda r: r["createdAt"],
            reverse=True,
        )

    return records


@router.delete("/history/{video_id}")
def delete_history_item(
    video_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    video = (
        db.query(Video)
        .filter(
            Video.id == video_id,
            Video.user_id == current_user.id,
        )
        .first()
    )

    if not video:
        raise HTTPException(
            status_code=404,
            detail="Video not found.",
        )

    video_title = video.title

    for path in (
        video.file_path,
        video.audio_path,
    ):
        if path and os.path.exists(path):
            try:
                os.remove(path)
            except OSError:
                pass

    activity_service.log(
        db,
        current_user.id,
        activity_service.VIDEO_DELETE,
        details=video_title,
    )

    db.delete(video)
    db.commit()

    return {
        "success": True,
        "id": video_id,
    }