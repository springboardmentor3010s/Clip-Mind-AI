from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from models.database import get_db
from models.db_models import Video, User
from routes.auth import get_current_user

router = APIRouter(tags=["search"])


@router.get("/search")
def search_videos(
    q: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not q or not q.strip():
        return []

    query = q.strip().lower()

    videos = (
        db.query(Video)
        .filter(Video.user_id == current_user.id)
        .order_by(Video.created_at.desc())
        .all()
    )

    results = []

    for video in videos:
        record = video.to_record()

        # Video title / filename
        if (
            query in video.title.lower()
            or query in video.file_name.lower()
        ):
            results.append(
                {
                    "videoId": video.id,
                    "title": video.title,
                    "type": "video",
                    "label": video.title,
                    "seconds": None,
                }
            )
            continue

        # Transcript matches
        transcript_match = None

        for segment in record.get("transcript") or []:
            text = str(segment.get("text", ""))

            if query in text.lower():
                transcript_match = segment
                break

        if transcript_match:
            results.append(
                {
                    "videoId": video.id,
                    "title": video.title,
                    "type": "transcript",
                    "label": transcript_match.get(
                        "text",
                        video.title,
                    ),
                    "seconds": float(
                        transcript_match.get("seconds", 0)
                    ),
                }
            )
            continue

        # Summary / topic matches
        summary = record.get("summary") or {}

        topics = summary.get("topics") or []

        topic_match = next(
            (
                topic
                for topic in topics
                if query in str(topic).lower()
            ),
            None,
        )

        if topic_match:
            results.append(
                {
                    "videoId": video.id,
                    "title": video.title,
                    "type": "topic",
                    "label": str(topic_match),
                    "seconds": None,
                }
            )
            continue

        summary_text = str(
            summary.get("text")
            or summary.get("summary")
            or ""
        )

        if query in summary_text.lower():
            results.append(
                {
                    "videoId": video.id,
                    "title": video.title,
                    "type": "summary",
                    "label": video.title,
                    "seconds": None,
                }
            )
            continue

        # Key moment matches
        moment_match = next(
            (
                moment
                for moment in record.get("moments") or []
                if query in str(
                    moment.get("title", "")
                ).lower()
                or query in str(
                    moment.get("description", "")
                ).lower()
            ),
            None,
        )

        if moment_match:
            results.append(
                {
                    "videoId": video.id,
                    "title": video.title,
                    "type": "moment",
                    "label": moment_match.get(
                        "title",
                        video.title,
                    ),
                    "seconds": float(
                        moment_match.get("seconds", 0)
                    ),
                }
            )
            continue

        # Analytics keyword matches
        analytics = record.get("analytics") or {}

        keyword_match = next(
            (
                keyword
                for keyword in analytics.get("keywords") or []
                if query in str(
                    keyword.get("term", "")
                ).lower()
            ),
            None,
        )

        if keyword_match:
            results.append(
                {
                    "videoId": video.id,
                    "title": video.title,
                    "type": "keyword",
                    "label": keyword_match.get(
                        "term",
                        video.title,
                    ),
                    "seconds": None,
                }
            )

    return results