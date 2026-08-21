from transformers import pipeline
from sqlalchemy.orm import Session

from app.models.video import Video

# ==========================================
# Load Model Once
# ==========================================

summarizer = pipeline(
    "summarization",
    model="facebook/bart-large-cnn"
)

# ==========================================
# Generate Normal Summary
# ==========================================

def generate_summary(db: Session, video_id: int):

    video = db.query(Video).filter(Video.id == video_id).first()

    if not video:
        return {
            "success": False,
            "message": "Video not found."
        }

    if not video.transcript:
        return {
            "success": False,
            "message": "Transcript not available."
        }

    transcript = video.transcript.strip()

    chunks = [
        transcript[i:i + 900]
        for i in range(0, len(transcript), 900)
    ]

    summaries = []

    for chunk in chunks:

        try:

            result = summarizer(
                chunk,
                max_length=150,
                min_length=40,
                do_sample=False
            )

            summaries.append(result[0]["summary_text"])

        except Exception:
            continue

    final_summary = "\n\n".join(summaries)

    video.summary = final_summary

    db.commit()
    db.refresh(video)

    return {
        "success": True,
        "video_id": video.id,
        "summary": final_summary
    }


# ==========================================
# Generate Short Summary
# ==========================================

def generate_short_summary(db: Session, video_id: int):

    video = db.query(Video).filter(Video.id == video_id).first()

    if not video:
        return "Video not found."

    if not video.transcript:
        return "Transcript not available."

    transcript = video.transcript[:1000]

    result = summarizer(
        transcript,
        max_length=80,
        min_length=20,
        do_sample=False
    )

    short_summary = result[0]["summary_text"]

    video.summary = short_summary

    db.commit()
    db.refresh(video)

    return short_summary


# ==========================================
# Generate Detailed Summary
# ==========================================

def generate_detailed_summary(db: Session, video_id: int):

    video = db.query(Video).filter(Video.id == video_id).first()

    if not video:
        return "Video not found."

    if not video.transcript:
        return "Transcript not available."

    transcript = video.transcript

    chunks = [
        transcript[i:i + 900]
        for i in range(0, len(transcript), 900)
    ]

    summaries = []

    for chunk in chunks:

        try:

            result = summarizer(
                chunk,
                max_length=220,
                min_length=80,
                do_sample=False
            )

            summaries.append(result[0]["summary_text"])

        except Exception:
            continue

    detailed_summary = "\n\n".join(summaries)

    video.summary = detailed_summary

    db.commit()
    db.refresh(video)

    return detailed_summary