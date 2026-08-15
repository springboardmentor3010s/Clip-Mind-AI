from sqlalchemy.orm import Session

from app.models.transcript_segment import TranscriptSegment


def create_transcript_segments(
    db: Session,
    transcript_id: int,
    video_id: int,
    segments: list
):
    transcript_segments = []

    for index, segment in enumerate(segments):
        transcript_segment = TranscriptSegment(
            transcript_id=transcript_id,
            video_id=video_id,
            segment_index=index,
            start_time=segment["start"],
            end_time=segment["end"],
            segment_text=segment["text"].strip()
        )

        transcript_segments.append(transcript_segment)

    db.add_all(transcript_segments)
    db.commit()

    return transcript_segments


def get_transcript_segments_by_video(
    db: Session,
    video_id: int
):
    return (
        db.query(TranscriptSegment)
        .filter(TranscriptSegment.video_id == video_id)
        .order_by(TranscriptSegment.segment_index)
        .all()
    )