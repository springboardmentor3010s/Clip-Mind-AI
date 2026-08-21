from fastapi import APIRouter, Depends, HTTPException
import os
import time
import json

from database import SessionLocal
from models import ProcessedVideo
from services.transcript import generate_transcript
from services.summary import generate_summary
from services.keymoments import detect_key_moments
from services.keywords import extract_keywords
from rbac import get_current_user

router = APIRouter()


@router.post("/process-video")
def process_video(
    filename: str,
    current_user=Depends(get_current_user)
):
    video_path = os.path.join("uploads", filename)

    if not os.path.exists(video_path):
        raise HTTPException(
            status_code=404,
            detail="Selected video not found."
        )

    start_time = time.time()

    transcript = generate_transcript(video_path)
    summary = generate_summary(transcript)
    key_moments = detect_key_moments(transcript)
    keywords = extract_keywords(transcript)

    processing_time = round(time.time() - start_time, 2)

    transcript_words = len(transcript.split())
    summary_words = len(summary.split())

    if transcript_words > 0:
        compression_ratio = round(
            (1 - (summary_words / transcript_words)) * 100,
            2
        )
    else:
        compression_ratio = 0

    uploaded_by = current_user.get("email")

    db = SessionLocal()

    try:
        # Check whether this video was already processed
        processed = (
            db.query(ProcessedVideo)
            .filter(ProcessedVideo.filename == filename)
            .first()
        )

        # Convert key moments to proper JSON
        key_moments_json = json.dumps(key_moments)

        if processed:
            # Update existing processed record
            processed.filepath = video_path
            processed.uploaded_by = uploaded_by
            processed.transcript = transcript
            processed.summary = summary
            processed.key_moments = key_moments_json
            processed.processing_time = str(processing_time)
            processed.transcript_words = transcript_words
            processed.summary_words = summary_words
            processed.compression_ratio = str(compression_ratio)

        else:
            # Create new processed record
            processed = ProcessedVideo(
                filename=filename,
                filepath=video_path,
                uploaded_by=uploaded_by,
                transcript=transcript,
                summary=summary,
                key_moments=key_moments_json,
                processing_time=str(processing_time),
                transcript_words=transcript_words,
                summary_words=summary_words,
                compression_ratio=str(compression_ratio)
            )

            db.add(processed)

        db.commit()
        db.refresh(processed)

    finally:
        db.close()

    return {
        "filename": filename,
        "transcript": transcript,
        "summary": summary,
        "key_moments": key_moments,
        "keywords": keywords,
        "processing_time": processing_time,
        "transcript_words": transcript_words,
        "summary_words": summary_words,
        "compression_ratio": compression_ratio,
        "uploaded_by": uploaded_by
    }