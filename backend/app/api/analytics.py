from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json

from app.database.database import get_db
from app.models.video import Video
from app.services.analytics_service import (
    generate_ai_insights,
    generate_quality_score,
)

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


# ======================================================
# Helper Function
# ======================================================

def parse_json_field(field):
    """
    Safely convert JSON field into Python list.
    """

    if field is None:
        return []

    if isinstance(field, list):
        return [item for item in field if item]

    if isinstance(field, str):
        try:
            data = json.loads(field)

            if isinstance(data, list):
                return [item for item in data if item]

            return []

        except Exception:
            return []

    return []


# ======================================================
# Analytics API
# ======================================================

@router.get("/{video_id}")
def get_video_analytics(
    video_id: int,
    db: Session = Depends(get_db)
):

    # ==================================================
    # Get Video
    # ==================================================

    video = (
        db.query(Video)
        .filter(Video.id == video_id)
        .first()
    )

    if not video:
        raise HTTPException(
            status_code=404,
            detail="Video not found."
        )

    # ==================================================
    # Parse JSON Fields
    # ==================================================

    key_moments = parse_json_field(video.key_moments)
    keywords = parse_json_field(video.keywords)

    # ==================================================
    # Generate Analytics
    # ==================================================

    analytics = generate_ai_insights(video)
    quality = generate_quality_score(video)

    # ==================================================
    # Processing Timeline
    # ==================================================

    timeline = [
        {
            "step": "Video Uploaded",
            "status": "Completed"
        },
        {
            "step": "Transcript Generated",
            "status": "Completed"
        },
        {
            "step": "Summary Generated",
            "status": "Completed"
        },
        {
            "step": "Keywords Extracted",
            "status": "Completed"
        },
        {
            "step": "Key Moments Detected",
            "status": "Completed"
        },
        {
            "step": "Analytics Generated",
            "status": "Completed"
        }
    ]

    # ==================================================
    # Response
    # ==================================================

    return {

        "video": {
            "id": video.id,
            "title": video.title,
            "duration": video.duration,
            "resolution": f"{video.width or 0} x {video.height or 0}",
            "codec": video.codec or "Unknown",
            "status": video.status,
            "created_at": video.created_at,
            "thumbnail": video.thumbnail_path
        },

        "transcript": {
            "text": video.transcript or "",
            "word_count": analytics["transcript_words"]
        },

        "summary": {
            "text": video.summary or "",
            "word_count": analytics["summary_words"]
        },

        "key_moments": {
            "count": len(key_moments),
            "items": key_moments
        },

        "keywords": {
            "count": len(keywords),
            "items": keywords
        },

        "statistics": {
            "duration": analytics["duration"],
            "transcript_words": analytics["transcript_words"],
            "summary_words": analytics["summary_words"],
            "keyword_count": len(keywords),
            "key_moment_count": len(key_moments),
            "reading_time": analytics["reading_time"],
            "speaking_speed": analytics["speaking_speed"]
        },

        "insights": analytics["insights"],

        "quality": {
            "overall": quality["overall"],
            "transcript_accuracy": quality["transcript_accuracy"],
            "summary_quality": quality["summary_quality"],
            "keyword_coverage": quality["keyword_coverage"],
            "key_moment_detection": quality["key_moment_detection"]
        },

        "timeline": timeline
    }