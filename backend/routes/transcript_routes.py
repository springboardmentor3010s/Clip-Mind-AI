from fastapi import APIRouter

from database import SessionLocal
from models import ProcessedVideo

router = APIRouter()


@router.get("/transcripts")
def get_transcripts():

    db = SessionLocal()

    transcripts = (
        db.query(ProcessedVideo)
        .order_by(ProcessedVideo.id.desc())
        .all()
    )

    result = []

    for item in transcripts:

        result.append({
            "id": item.id,
            "filename": item.filename,
            "transcript": item.transcript
        })

    db.close()

    return result