from fastapi import APIRouter, Depends
from database import SessionLocal
from models import Video, ProcessedVideo
from rbac import require_role

router = APIRouter()


@router.get("/videos")
def get_videos(
    current_user=Depends(
        require_role(
    "creator",
    "content_creator",
    "educator",
    "learner",
    "admin"
)
    )
):
    db = SessionLocal()

    try:
        videos = db.query(Video).order_by(Video.id.desc()).all()

        processed = db.query(ProcessedVideo).all()

        processed_map = {
            p.filename: p for p in processed
        }

        result = []

        for video in videos:
            p = processed_map.get(video.filename)

            result.append({
                "id": video.id,
                "filename": video.filename,
                "filepath": video.filepath,
                "uploaded_by": video.uploaded_by,
                "processed": p is not None,
                "status": "Processed" if p else "Uploaded",
                "transcript": p.transcript if p else "",
                "summary": p.summary if p else "",
                "key_moments": p.key_moments if p else "[]",
                "transcript_words": p.transcript_words or 0 if p else 0,
                "summary_words": p.summary_words or 0 if p else 0,
                "compression_ratio": p.compression_ratio or 0 if p else 0,
                "processing_time": p.processing_time or 0 if p else 0
            })

        return result

    finally:
        db.close()