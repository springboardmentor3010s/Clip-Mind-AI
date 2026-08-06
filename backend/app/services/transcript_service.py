import json

from sqlalchemy.orm import Session

from app.models.transcript import Transcript


def save_transcript(

    db: Session,

    video_id: int,

    transcript_text: str,

    transcript_segments

):

    transcript = Transcript(

        video_id=video_id,

        transcript_text=transcript_text,

        transcript_json=json.dumps(

            transcript_segments

        )

    )

    db.add(transcript)

    db.commit()

    db.refresh(transcript)

    return transcript