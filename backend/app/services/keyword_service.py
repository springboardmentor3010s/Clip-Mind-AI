import re
from collections import Counter
from sqlalchemy.orm import Session

from app.models.video import Video


STOPWORDS = {
    "the", "is", "a", "an", "and", "to", "of",
    "for", "in", "on", "with", "that", "this",
    "are", "was", "were", "be", "been", "it",
    "as", "by", "at", "or", "from", "into",
    "their", "its", "they", "them"
}


def generate_keywords(db: Session, video_id: int):

    video = db.query(Video).filter(Video.id == video_id).first()

    if not video:
        return {
            "success": False,
            "message": "Video not found"
        }

    if not video.transcript:
        return {
            "success": False,
            "message": "Transcript not found"
        }

    transcript = video.transcript.lower()

    words = re.findall(r"\b[a-zA-Z]{4,}\b", transcript)

    filtered_words = [
        word
        for word in words
        if word not in STOPWORDS
    ]

    counter = Counter(filtered_words)

    keywords = []

    for word, count in counter.most_common(10):
        keywords.append({
            "keyword": word,
            "count": count
        })

    video.keywords = keywords

    db.commit()
    db.refresh(video)

    return {
        "success": True,
        "video_id": video.id,
        "keywords": keywords
    }