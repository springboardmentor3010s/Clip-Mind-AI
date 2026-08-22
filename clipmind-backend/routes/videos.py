import mimetypes
import os
import re
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

import config
from models.database import get_db
from models.db_models import Video, User
from services import ffmpeg_service, activity_service
from services.time_utils import title_from_file
from routes.auth import require_roles, get_current_user_flexible

router = APIRouter(tags=["videos"])

RANGE_RE = re.compile(r"bytes=(\d*)-(\d*)")
CHUNK_SIZE = 1024 * 1024  # 1MB


def _iter_file_range(path: str, start: int, end: int):
    with open(path, "rb") as f:
        f.seek(start)
        remaining = end - start + 1
        while remaining > 0:
            chunk = f.read(min(CHUNK_SIZE, remaining))
            if not chunk:
                break
            remaining -= len(chunk)
            yield chunk


@router.post("/upload")
async def upload_video(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "Content Creator",
            "Educator",
            "Administrator",
        )
    ),
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file provided.",
        )

    ext = os.path.splitext(file.filename)[1].lower()

    if ext not in config.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported file type '{ext}'. "
                f"Allowed: {', '.join(sorted(config.ALLOWED_EXTENSIONS))}"
            ),
        )

    video_id = str(uuid.uuid4())
    saved_name = f"{video_id}{ext}"
    saved_path = os.path.join(
        config.UPLOAD_DIR,
        saved_name,
    )

    size_bytes = 0

    try:
        with open(saved_path, "wb") as out:
            while True:
                chunk = await file.read(1024 * 1024)

                if not chunk:
                    break

                size_bytes += len(chunk)

                if (
                    size_bytes
                    > config.MAX_UPLOAD_MB * 1024 * 1024
                ):
                    out.close()
                    os.remove(saved_path)

                    raise HTTPException(
                        status_code=413,
                        detail="File exceeds maximum upload size.",
                    )

                out.write(chunk)

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save upload: {e}",
        ) from e

    if size_bytes == 0:
        os.remove(saved_path)

        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty.",
        )

    duration_seconds = 0.0

    size_mb = round(
        size_bytes / 1048576,
        1,
    )

    video = Video(
        id=video_id,
        user_id=current_user.id,
        title=title_from_file(file.filename),
        file_name=file.filename,
        file_path=saved_path,
        audio_path=None,
        size_mb=size_mb,
        duration_seconds=duration_seconds,
        status="Queued",
        created_at=datetime.now(
            timezone.utc
        ).isoformat(),
        language="Unknown",
        transcript_json="[]",
        summary_json=None,
        moments_json="[]",
        analytics_json=None,
    )

    db.add(video)
    db.commit()
    db.refresh(video)

    activity_service.log(
        db, current_user.id, activity_service.VIDEO_UPLOAD, video_id=video.id, details=video.title
    )

    return video.to_record()


@router.get("/videos")
def list_videos(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "Content Creator",
            "Learner",
            "Educator",
            "Administrator",
        )
    ),
):
    videos = (
        db.query(Video)
        .filter(Video.user_id == current_user.id)
        .order_by(Video.created_at.desc())
        .all()
    )

    return [v.to_record() for v in videos]


@router.get("/videos/{video_id}")
def get_video(
    video_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "Content Creator",
            "Learner",
            "Educator",
            "Administrator",
        )
    ),
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

    return video.to_record()


@router.get("/videos/{video_id}/media")
def get_video_media(
    video_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_flexible),
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
        raise HTTPException(status_code=404, detail="Video not found.")

    if not video.file_path or not os.path.exists(video.file_path):
        raise HTTPException(status_code=404, detail="Media file is missing from storage.")

    file_size = os.path.getsize(video.file_path)
    media_type = mimetypes.guess_type(video.file_path)[0] or "application/octet-stream"

    range_header = request.headers.get("range")

    if range_header:
        match = RANGE_RE.match(range_header)
        if not match:
            raise HTTPException(status_code=416, detail="Invalid Range header.")

        start_str, end_str = match.groups()
        start = int(start_str) if start_str else 0
        end = int(end_str) if end_str else file_size - 1
        end = min(end, file_size - 1)

        if start > end or start >= file_size:
            raise HTTPException(status_code=416, detail="Requested range not satisfiable.")

        headers = {
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(end - start + 1),
        }

        return StreamingResponse(
            _iter_file_range(video.file_path, start, end),
            status_code=206,
            media_type=media_type,
            headers=headers,
        )

    headers = {
        "Accept-Ranges": "bytes",
        "Content-Length": str(file_size),
    }

    return StreamingResponse(
        _iter_file_range(video.file_path, 0, file_size - 1),
        status_code=200,
        media_type=media_type,
        headers=headers,
    )


@router.delete("/videos/{video_id}")
def delete_video(
    video_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "Content Creator",
            "Educator",
            "Administrator",
        )
    ),
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
        details=video.title,
    )

    db.delete(video)
    db.commit()

    return {
        "success": True,
        "id": video_id,
    }