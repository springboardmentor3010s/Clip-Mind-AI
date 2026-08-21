from fastapi import APIRouter

from database import SessionLocal
from models import ProcessedVideo

router = APIRouter()


@router.get("/summaries")
def get_summaries():

    db = SessionLocal()

    summaries = (
        db.query(ProcessedVideo)
        .order_by(ProcessedVideo.id.desc())
        .all()
    )

    result = []

    for item in summaries:

        result.append({
            "id": item.id,
            "filename": item.filename,
            "summary": item.summary,
            "processing_time": item.processing_time,
            "transcript_words": item.transcript_words,
            "summary_words": item.summary_words,
            "compression_ratio": item.compression_ratio
        })

    db.close()

    return result