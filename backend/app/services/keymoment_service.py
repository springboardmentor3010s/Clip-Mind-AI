from sqlalchemy.orm import Session

from app.models.video import Video


# ==========================================
# Format Timestamp
# ==========================================

def format_timestamp(seconds):
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)

    return f"{hours:02}:{minutes:02}:{secs:02}"


# ==========================================
# Generate Key Moments
# ==========================================

def generate_key_moments(db: Session, video_id: int):

    # Fetch video
    video = db.query(Video).filter(Video.id == video_id).first()

    if not video:
        return {
            "success": False,
            "message": "Video not found"
        }

    # Transcript check
    if not video.transcript:
        return {
            "success": False,
            "message": "Transcript not found"
        }

    transcript = video.transcript.strip()

    # Split transcript into sentences
    sentences = [
        sentence.strip()
        for sentence in transcript.split(".")
        if sentence.strip()
    ]

    if len(sentences) == 0:
        return {
            "success": False,
            "message": "Transcript is empty"
        }

    # Calculate timestamp interval
    duration = video.duration or 0

    if duration > 0:
        step = duration / len(sentences)
    else:
        step = 15

    key_moments = []
    current_time = 0

    # Generate key moments
    for sentence in sentences:

        if len(sentence) > 40:
            key_moments.append({
                "timestamp": format_timestamp(current_time),
                "text": sentence
            })

        current_time += step

    # Save directly to JSON column
    video.key_moments = key_moments

    db.commit()
    db.refresh(video)

    return {
        "success": True,
        "video_id": video.id,
        "key_moments": video.key_moments
    }