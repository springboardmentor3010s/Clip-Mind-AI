from app.database.connection import SessionLocal

from app.models.user import User
from app.models.video import Video
from app.models.activity_history import ActivityHistory
from app.models.transcript import Transcript
from app.models.summary import Summary
from app.models.transcript_segment import TranscriptSegment
from app.models.key_moment import KeyMoment

from app.services.key_moment_service import detect_key_moments


VIDEO_ID = 44


def test_real_video_key_moments():

    db = SessionLocal()

    try:
        # Get the actual video
        video = (
            db.query(Video)
            .filter(Video.id == VIDEO_ID)
            .first()
        )

        assert video is not None, (
            f"Video {VIDEO_ID} was not found."
        )

        # Get transcript segments
        segments = (
            db.query(TranscriptSegment)
            .filter(
                TranscriptSegment.video_id == VIDEO_ID
            )
            .order_by(
                TranscriptSegment.segment_index
            )
            .all()
        )

        assert segments, (
            f"No transcript segments found "
            f"for video {VIDEO_ID}."
        )

        # Get the short summary
        summary = (
            db.query(Summary)
            .filter(
                Summary.video_id == VIDEO_ID,
                Summary.summary_type == "short"
            )
            .first()
        )

        assert summary is not None, (
            f"No short summary found "
            f"for video {VIDEO_ID}."
        )

        # Run key-moment detection
        key_moments = detect_key_moments(
            segments=segments,
            summary_text=summary.summary_text,
            max_moments=5
        )

        assert key_moments, (
            "No key moments were detected."
        )

        print("\n")
        print("=" * 60)
        print("KEY MOMENTS FOR VIDEO", VIDEO_ID)
        print("=" * 60)

        for index, moment in enumerate(
            key_moments,
            start=1
        ):
            print(f"\nKEY MOMENT {index}")
            print(
                f"Segment ID: "
                f"{moment['transcript_segment_id']}"
            )
            print(
                f"Time: "
                f"{moment['start_time']:.2f}s - "
                f"{moment['end_time']:.2f}s"
            )
            print(
                f"Score: "
                f"{moment['importance_score']}"
            )
            print(
                f"Title: "
                f"{moment['title']}"
            )
            print(
                f"Text: "
                f"{moment['segment_text']}"
            )

        print("\n" + "=" * 60)

    finally:
        db.close()