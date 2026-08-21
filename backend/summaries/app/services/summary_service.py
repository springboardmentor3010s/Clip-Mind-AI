from transformers import pipeline
from sqlalchemy.orm import Session

from app.models.video import Video

# Load summarization model once when the application starts
summarizer = pipeline(
    "summarization",
    model="facebook/bart-large-cnn"
)


def generate_summary(db: Session, video_id: int):
    """
    Generate AI summary from the video's transcript.
    """

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

    # Hugging Face models have input length limits.
    # Summarize in chunks if needed.
    max_chunk_size = 900

    chunks = [
        transcript[i:i + max_chunk_size]
        for i in range(0, len(transcript), max_chunk_size)
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