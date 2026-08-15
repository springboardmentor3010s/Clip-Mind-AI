"""
AI summary generation and retrieval routes.
Requires a transcript to already exist for the video. Includes
translation, shortening, bullet-point formatting, and Q&A generation.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status  # type: ignore
from pydantic import BaseModel  # type: ignore

from app.db.mongodb import transcripts_collection, summaries_collection
from app.models.user import User
from app.api.deps import get_current_user
from app.services.summarization import generate_summary, shorten_summary, bulletify_summary
from app.services.translation import translate_text
from app.services.qagen import generate_qa_pairs

router = APIRouter()


class GenerateSummaryRequest(BaseModel):
    video_id: str
    output_language: str = "auto"


@router.post("/generate")
async def generate_video_summary(
    payload: GenerateSummaryRequest,
    current_user: User = Depends(get_current_user),
):
    if current_user.role.value == "learner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Learners have view-only access and cannot generate summaries.",
        )
    transcript_doc = await transcripts_collection.find_one({
        "video_id": payload.video_id, "user_id": str(current_user.user_id)
    })
    if not transcript_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No transcript found for this video. Please generate a transcript first.",
        )

    source_language = transcript_doc.get("output_language", "en")
    text = transcript_doc["text"]

    english_text = text
    if source_language != "en":
        english_text = translate_text(text, "en")

    result = generate_summary(english_text)

    target_language = payload.output_language
    if target_language == "auto":
        target_language = source_language

    short_summary = result["short_summary"]
    detailed_summary = result["detailed_summary"]

    if target_language != "en":
        short_summary = translate_text(short_summary, target_language)
        detailed_summary = translate_text(detailed_summary, target_language)

    original_word_count = len(text.split())
    summary_word_count = len(detailed_summary.split())
    compression_ratio = round((1 - summary_word_count / original_word_count) * 100, 1) if original_word_count else 0

    doc = {
        "video_id": payload.video_id,
        "user_id": str(current_user.user_id),
        "video_title": transcript_doc.get("video_title", "Video"),
        "language": target_language,
        "short_summary": short_summary,
        "detailed_summary": detailed_summary,
        "original_word_count": original_word_count,
        "summary_word_count": summary_word_count,
        "compression_ratio": compression_ratio,
        "created_at": datetime.utcnow(),
    }

    await summaries_collection.delete_many({"video_id": payload.video_id, "user_id": str(current_user.user_id)})
    await summaries_collection.insert_one(doc)

    # Log this as an analytics event
    from app.models.analytics import AnalyticsEvent
    from app.db.postgres import SessionLocal
    import uuid as uuid_lib

    db = SessionLocal()
    try:
        event = AnalyticsEvent(
            user_id=current_user.user_id,
            video_id=uuid_lib.UUID(payload.video_id),
            video_title=doc["video_title"],
            event_type="summary_generated",
        )
        db.add(event)
        db.commit()
    finally:
        db.close()

    doc["_id"] = None
    return doc


@router.get("/{video_id}")
async def get_summary(video_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role.value == "learner":
        doc = await summaries_collection.find_one({"video_id": video_id})
    else:
        doc = await summaries_collection.find_one({"video_id": video_id, "user_id": str(current_user.user_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No summary found for this video.")
    doc["_id"] = str(doc["_id"])
    return doc


class ShortenRequest(BaseModel):
    video_id: str


@router.post("/shorten")
async def make_summary_shorter(payload: ShortenRequest, current_user: User = Depends(get_current_user)):
    doc = await summaries_collection.find_one({"video_id": payload.video_id, "user_id": str(current_user.user_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No summary found for this video.")

    language = doc.get("language", "en")
    current_short = doc["short_summary"]

    text_to_shorten = current_short
    if language != "en":
        text_to_shorten = translate_text(current_short, "en")

    shorter_english = shorten_summary(text_to_shorten, max_words=25)

    new_short = shorter_english
    if language != "en":
        new_short = translate_text(shorter_english, language)

    await summaries_collection.update_one(
        {"video_id": payload.video_id, "user_id": str(current_user.user_id)},
        {"$set": {"short_summary": new_short}},
    )

    doc["short_summary"] = new_short
    doc["_id"] = None
    return doc


class BulletRequest(BaseModel):
    video_id: str


@router.post("/bullets")
async def get_summary_as_bullets(payload: BulletRequest, current_user: User = Depends(get_current_user)):
    doc = await summaries_collection.find_one({"video_id": payload.video_id, "user_id": str(current_user.user_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No summary found for this video.")

    bullets = bulletify_summary(doc["detailed_summary"])
    return {"bullets": bullets}


class QARequest(BaseModel):
    video_id: str


@router.post("/qa")
async def generate_qa(payload: QARequest, current_user: User = Depends(get_current_user)):
    doc = await summaries_collection.find_one({"video_id": payload.video_id, "user_id": str(current_user.user_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No summary found for this video.")

    text = doc.get("detailed_summary", "")
    language = doc.get("language", "en")
    if language != "en":
        text = translate_text(text, "en")

    qa_pairs = generate_qa_pairs(text)

    if language != "en":
        for pair in qa_pairs:
            pair["question"] = translate_text(pair["question"], language)
            pair["answer"] = translate_text(pair["answer"], language)

    return {"qa_pairs": qa_pairs}