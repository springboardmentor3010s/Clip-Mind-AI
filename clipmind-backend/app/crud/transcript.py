import os
from sqlalchemy.orm import Session


from app.models.transcript import Transcript
from app.models.video import Video


def create_transcript(
    db: Session,
    video: Video,
    transcript_text: str,
    transcript_file_path: str,
    language: str = "en"
):

    transcript = Transcript(
        video_id=video.id,
        transcript_text=transcript_text,
        transcript_file_path=transcript_file_path,
        language=language
    )

    db.add(transcript)
    db.commit()
    db.refresh(transcript)

    return transcript


def get_transcript_by_video(
    db: Session,
    video: Video
):

    return (
        db.query(Transcript)
        .filter(
            Transcript.video_id == video.id
        )
        .first()
    )

def update_transcript(
    db: Session,
    transcript: Transcript,
    transcript_text: str
):
    # Update database transcript
    transcript.transcript_text = transcript_text

    db.commit()
    db.refresh(transcript)

    # Keep the physical transcript file in sync
    if transcript.transcript_file_path:
        os.makedirs(
            os.path.dirname(transcript.transcript_file_path)
            or ".",
            exist_ok=True
        )

        with open(
            transcript.transcript_file_path,
            "w",
            encoding="utf-8"
        ) as file:
            file.write(transcript_text)

    return transcript