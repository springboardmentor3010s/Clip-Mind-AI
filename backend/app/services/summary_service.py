"""
Video Summarization Module: runs a BART summarization pipeline over a
video's transcript and stores short + detailed summaries in MongoDB.
"""
import asyncio
import time
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.mongo import summaries_collection, transcripts_collection
from app.models.user import User
from app.services.ai_models import get_summarizer
from app.services.evaluation_service import compute_summary_metrics
from app.services.video_service import get_video_or_404

CHUNK_WORD_LIMIT = 700


def _chunk_text(text: str, word_limit: int = CHUNK_WORD_LIMIT) -> list[str]:
    words = text.split()
    if not words:
        return [""]
    return [" ".join(words[i : i + word_limit]) for i in range(0, len(words), word_limit)]


def _summarize_chunks(chunks: list[str]) -> list[str]:
    summarizer = get_summarizer()
    outputs = []
    for chunk in chunks:
        word_count = len(chunk.split())
        if word_count < 30:
            outputs.append(chunk)
            continue
        max_len = min(150, max(30, word_count // 2))
        result = summarizer(chunk, max_length=max_len, min_length=min(20, max_len - 5), do_sample=False)
        outputs.append(result[0]["summary_text"].strip())
    return outputs


async def generate_summary(db: Session, video_id, current_user: User) -> dict:
    get_video_or_404(db, video_id, current_user)

    transcript = await transcripts_collection.find_one({"video_id": str(video_id)})
    if not transcript or not transcript.get("text"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No transcript found for this video yet. Generate the transcript first.",
        )

    start_time = time.perf_counter()

    chunks = _chunk_text(transcript["text"])
    chunk_summaries = await asyncio.to_thread(_summarize_chunks, chunks)

    detailed_summary = " ".join(chunk_summaries)

    if len(chunk_summaries) > 1:
        short_summary = (await asyncio.to_thread(_summarize_chunks, [detailed_summary]))[0]
    else:
        short_summary = chunk_summaries[0]

    elapsed = time.perf_counter() - start_time

    metrics = compute_summary_metrics(
        transcript_text=transcript["text"],
        detailed_summary=detailed_summary,
        short_summary=short_summary,
        processing_time_seconds=elapsed,
    )

    doc = {
        "video_id": str(video_id),
        "owner_id": str(current_user.id),
        "short_summary": short_summary,
        "detailed_summary": detailed_summary,
        "status": "done",
        "metrics": metrics,
        "created_at": datetime.now(timezone.utc),
    }

    await summaries_collection.update_one(
        {"video_id": str(video_id)}, {"$set": doc}, upsert=True
    )

    return doc


async def get_summary(db: Session, video_id, current_user: User) -> dict:
    get_video_or_404(db, video_id, current_user, require_owner=False)

    doc = await summaries_collection.find_one({"video_id": str(video_id)})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Summary not found. Generate it first.",
        )
    return doc