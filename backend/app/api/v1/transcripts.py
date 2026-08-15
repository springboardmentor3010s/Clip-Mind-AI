"""
Transcript generation and retrieval routes.
Uses Whisper for speech-to-text, with optional translation, filler-word
cleanup, keyword extraction, and auto-generated chapters.
"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status  # type: ignore[import]
from fastapi.responses import PlainTextResponse  # type: ignore[import]
from pydantic import BaseModel  # type: ignore[import]
from sqlalchemy.orm import Session  # type: ignore[import]

from app.db.postgres import get_db
from app.db.mongodb import transcripts_collection
from app.models.video import Video
from app.models.user import User
from app.api.deps import get_current_user
from app.services.transcription import transcribe_audio, clean_filler_words
from app.services.translation import translate_segments, translate_text
from app.services.keywords import extract_keywords
from app.services.chapters import generate_chapters

router = APIRouter()


class GenerateTranscriptRequest(BaseModel):
    video_id: str
    language: str = "auto"
    translate_to: str | None = None


@router.post("/generate")
async def generate_transcript(
    payload: GenerateTranscriptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.value == "learner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Learners have view-only access and cannot generate transcripts.",
        )
    video = db.query(Video).filter(
        Video.video_id == payload.video_id, Video.user_id == current_user.user_id
    ).first()

    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found.")
    if not video.audio_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This video has no extracted audio. Please re-upload it.",
        )

    result = transcribe_audio(video.audio_path, payload.language)
    detected_language = result["language"]
    segments = result["segments"]
    full_text = result["text"]

    output_language = detected_language

    if payload.translate_to and payload.translate_to != "auto" and payload.translate_to != detected_language:
        segments = translate_segments(segments, payload.translate_to)
        full_text = translate_text(result["text"], payload.translate_to)
        output_language = payload.translate_to

    doc = {
        "video_id": str(video.video_id),
        "user_id": str(current_user.user_id),
        "video_title": video.title,
        "spoken_language": detected_language,
        "output_language": output_language,
        "text": full_text,
        "segments": segments,
        "processing_time_seconds": result.get("processing_time_seconds"),
        "confidence_score": result.get("confidence_score"),
        "word_count": len(full_text.split()),
        "created_at": datetime.utcnow(),
    }

    await transcripts_collection.delete_many({"video_id": str(video.video_id)})
    await transcripts_collection.insert_one(doc)

    # Log this as an analytics event
    from app.models.analytics import AnalyticsEvent
    event = AnalyticsEvent(
        user_id=current_user.user_id,
        video_id=video.video_id,
        video_title=video.title,
        event_type="transcript_generated",
    )
    db.add(event)
    db.commit()

    doc["_id"] = None
    return doc


@router.get("/{video_id}")
async def get_transcript(video_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role.value == "learner":
        doc = await transcripts_collection.find_one({"video_id": video_id})
    else:
        doc = await transcripts_collection.find_one({"video_id": video_id, "user_id": str(current_user.user_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No transcript found for this video.")
    doc["_id"] = str(doc["_id"])
    return doc


@router.get("/{video_id}/download")
async def download_transcript(video_id: str, current_user: User = Depends(get_current_user)):
    doc = await transcripts_collection.find_one({"video_id": video_id, "user_id": str(current_user.user_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No transcript found for this video.")

    lines = [
        f"Transcript — {doc.get('video_title', 'Video')}",
        f"Spoken language: {doc.get('spoken_language', 'unknown')}",
        f"Transcript language: {doc.get('output_language', 'unknown')}",
        "",
    ]
    for seg in doc["segments"]:
        mins, secs = divmod(int(seg["start"]), 60)
        lines.append(f"[{mins:02d}:{secs:02d}] {seg['text']}")

    content = "\n".join(lines)
    filename = f"{doc.get('video_title', 'transcript').rsplit('.', 1)[0]}_{doc.get('output_language', 'transcript')}.txt"

    return PlainTextResponse(
        content,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{video_id}/download-srt")
async def download_transcript_srt(video_id: str, current_user: User = Depends(get_current_user)):
    doc = await transcripts_collection.find_one({"video_id": video_id, "user_id": str(current_user.user_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No transcript found for this video.")

    def srt_timestamp(seconds: float) -> str:
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        milles = int((seconds - int(seconds)) * 1000)
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{milles:03d}"

    lines = []
    for i, seg in enumerate(doc["segments"], start=1):
        lines.append(str(i))
        lines.append(f"{srt_timestamp(seg['start'])} --> {srt_timestamp(seg['end'])}")
        lines.append(seg["text"])
        lines.append("")

    content = "\n".join(lines)
    filename = f"{doc.get('video_title', 'transcript').rsplit('.', 1)[0]}.srt"

    return PlainTextResponse(
        content,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


class UpdateSegmentRequest(BaseModel):
    video_id: str
    segment_index: int
    text: str


@router.patch("/segment")
async def update_segment(payload: UpdateSegmentRequest, current_user: User = Depends(get_current_user)):
    doc = await transcripts_collection.find_one({
        "video_id": payload.video_id, "user_id": str(current_user.user_id)
    })
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transcript not found.")

    segments = doc["segments"]
    if payload.segment_index < 0 or payload.segment_index >= len(segments):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid segment index.")

    segments[payload.segment_index]["text"] = payload.text
    full_text = " ".join(s["text"] for s in segments)

    await transcripts_collection.update_one(
        {"video_id": payload.video_id, "user_id": str(current_user.user_id)},
        {"$set": {"segments": segments, "text": full_text}},
    )

    return {"message": "Segment updated.", "segments": segments}


@router.get("/{video_id}/quality")
async def get_transcript_quality(video_id: str, current_user: User = Depends(get_current_user)):
    doc = await transcripts_collection.find_one({"video_id": video_id, "user_id": str(current_user.user_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No transcript found for this video.")

    return {
        "confidence_score": doc.get("confidence_score"),
        "processing_time_seconds": doc.get("processing_time_seconds"),
        "word_count": doc.get("word_count"),
        "segment_count": len(doc.get("segments", [])),
    }


@router.get("/{video_id}/clean")
async def get_clean_transcript(video_id: str, current_user: User = Depends(get_current_user)):
    doc = await transcripts_collection.find_one({"video_id": video_id, "user_id": str(current_user.user_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No transcript found for this video.")

    cleaned_segments = clean_filler_words(doc["segments"])
    return {"segments": cleaned_segments}


@router.get("/{video_id}/keywords")
async def get_transcript_keywords(video_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role.value == "learner":
        doc = await transcripts_collection.find_one({"video_id": video_id})
    else:
        doc = await transcripts_collection.find_one({"video_id": video_id, "user_id": str(current_user.user_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No transcript found for this video.")

    keywords = extract_keywords(doc["text"])
    return {"keywords": keywords}


@router.get("/{video_id}/chapters")
async def get_transcript_chapters(video_id: str, current_user: User = Depends(get_current_user)):
    doc = await transcripts_collection.find_one({"video_id": video_id, "user_id": str(current_user.user_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No transcript found for this video.")

    chapters = generate_chapters(doc["segments"])
    return {"chapters": chapters}