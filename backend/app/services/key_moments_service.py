"""
Key Moments Detection Module.

Builds on the timestamped segments already produced by Whisper during
transcript generation (Milestone 2) rather than requiring a separate
heavyweight model. For each video's transcript we compute:

- Keyword extraction: TF-IDF across the transcript's segments, top terms
  by aggregate weight.
- Important segment identification / highlight extraction: each segment
  scored by its own TF-IDF weight mass, top-scoring segments returned as
  timestamped highlights.
- Topic segmentation: KMeans clustering of segment TF-IDF vectors,
  contiguous same-cluster segments merged into topic blocks with a
  representative label.

This is a classic extractive/unsupervised approach — no model download
required, runs in milliseconds even on CPU, and works directly off data
we already have.
"""
import time
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer
from sqlalchemy.orm import Session

from app.core.mongo import key_moments_collection, transcripts_collection
from app.models.user import User
from app.services.video_service import get_video_or_404

MAX_HIGHLIGHTS = 8
MIN_HIGHLIGHTS = 3
TOP_KEYWORDS_GLOBAL = 10
TOP_KEYWORDS_PER_UNIT = 4


def _top_terms(vector_row, feature_names, top_n: int) -> list[str]:
    """Given a single TF-IDF row (dense or sparse), return its top-N terms."""
    row = vector_row.toarray().ravel() if hasattr(vector_row, "toarray") else vector_row
    if row.sum() == 0:
        return []
    top_idx = row.argsort()[::-1][:top_n]
    return [feature_names[i] for i in top_idx if row[i] > 0]


def analyze_transcript(segments: list[dict]) -> dict:
    """
    Pure function: transcript segments in, key-moments analysis out.
    Kept separate from DB access so it can be unit-tested with plain data.
    """
    texts = [seg["text"].strip() for seg in segments if seg.get("text", "").strip()]
    usable_segments = [seg for seg in segments if seg.get("text", "").strip()]

    if len(texts) < 2:
        return {
            "keywords": [],
            "highlights": [],
            "topics": [],
            "segment_count": len(usable_segments),
        }

    vectorizer = TfidfVectorizer(stop_words="english", max_features=500)
    tfidf_matrix = vectorizer.fit_transform(texts)
    feature_names = vectorizer.get_feature_names_out()

    # --- Global keywords: aggregate TF-IDF weight per term across all segments ---
    aggregate_weights = tfidf_matrix.sum(axis=0).A1
    top_global_idx = aggregate_weights.argsort()[::-1][:TOP_KEYWORDS_GLOBAL]
    keywords = [feature_names[i] for i in top_global_idx if aggregate_weights[i] > 0]

    # --- Highlights: score each segment by its own TF-IDF weight mass ---
    segment_scores = tfidf_matrix.sum(axis=1).A1
    max_score = segment_scores.max() or 1.0
    normalized_scores = segment_scores / max_score

    n_highlights = max(MIN_HIGHLIGHTS, min(MAX_HIGHLIGHTS, len(usable_segments) // 5 or MIN_HIGHLIGHTS))
    n_highlights = min(n_highlights, len(usable_segments))
    top_highlight_idx = sorted(normalized_scores.argsort()[::-1][:n_highlights])

    highlights = []
    for idx in top_highlight_idx:
        seg = usable_segments[idx]
        highlights.append({
            "start": seg["start"],
            "end": seg["end"],
            "text": seg["text"].strip(),
            "importance_score": round(float(normalized_scores[idx]), 4),
            "keywords": _top_terms(tfidf_matrix[idx], feature_names, TOP_KEYWORDS_PER_UNIT),
        })

    # --- Topic segmentation: cluster segments, merge contiguous same-cluster runs ---
    n_topics = max(1, min(6, len(usable_segments) // 4 or 1))
    n_topics = min(n_topics, len(usable_segments))

    if n_topics > 1:
        labels = KMeans(n_clusters=n_topics, n_init=10, random_state=42).fit_predict(tfidf_matrix)
    else:
        labels = [0] * len(usable_segments)

    topics = []
    run_start_idx = 0
    for i in range(1, len(usable_segments) + 1):
        end_of_run = i == len(usable_segments) or labels[i] != labels[run_start_idx]
        if end_of_run:
            run_indices = list(range(run_start_idx, i))
            run_matrix = tfidf_matrix[run_indices]
            aggregate = run_matrix.sum(axis=0).A1
            top_idx = aggregate.argsort()[::-1][:TOP_KEYWORDS_PER_UNIT]
            topic_keywords = [feature_names[j] for j in top_idx if aggregate[j] > 0]
            topics.append({
                "start": usable_segments[run_start_idx]["start"],
                "end": usable_segments[i - 1]["end"],
                "label": topic_keywords[0] if topic_keywords else "General",
                "keywords": topic_keywords,
                "segment_count": len(run_indices),
            })
            run_start_idx = i

    return {
        "keywords": keywords,
        "highlights": highlights,
        "topics": topics,
        "segment_count": len(usable_segments),
    }


async def generate_key_moments(db: Session, video_id: uuid.UUID, current_user: User) -> dict:
    get_video_or_404(db, video_id, current_user)

    transcript = await transcripts_collection.find_one({"video_id": str(video_id)})
    if not transcript or not transcript.get("segments"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No transcript found for this video yet. Generate the transcript first.",
        )

    start_time = time.perf_counter()
    analysis = analyze_transcript(transcript["segments"])
    elapsed = time.perf_counter() - start_time

    doc = {
        "video_id": str(video_id),
        "owner_id": str(current_user.id),
        "keywords": analysis["keywords"],
        "highlights": analysis["highlights"],
        "topics": analysis["topics"],
        "status": "done",
        "metrics": {
            "segment_count": analysis["segment_count"],
            "highlight_count": len(analysis["highlights"]),
            "topic_count": len(analysis["topics"]),
            "processing_time_seconds": round(elapsed, 4),
        },
        "created_at": datetime.now(timezone.utc),
    }

    await key_moments_collection.update_one(
        {"video_id": str(video_id)}, {"$set": doc}, upsert=True
    )

    return doc


async def get_key_moments(db: Session, video_id: uuid.UUID, current_user: User) -> dict:
    get_video_or_404(db, video_id, current_user)

    doc = await key_moments_collection.find_one({"video_id": str(video_id)})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Key moments not found. Generate them first.",
        )
    return doc