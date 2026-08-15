from app.database.connection import SessionLocal

from app.models.user import User
from app.models.video import Video
from app.models.activity_history import ActivityHistory
from app.models.transcript import Transcript
from app.models.summary import Summary
from app.models.transcript_segment import TranscriptSegment
from app.models.key_moment import KeyMoment

from app.services.highlight_report_service import (
    generate_highlight_report
)


VIDEO_ID = 44


def test_generate_highlight_report():

    db = SessionLocal()

    try:
        # Get video
        video = (
            db.query(Video)
            .filter(Video.id == VIDEO_ID)
            .first()
        )

        assert video is not None, (
            f"Video {VIDEO_ID} was not found."
        )

        # Get short summary
        summary = (
            db.query(Summary)
            .filter(
                Summary.video_id == VIDEO_ID,
                Summary.summary_type == "short"
            )
            .first()
        )

        assert summary is not None, (
            f"Short summary not found "
            f"for video {VIDEO_ID}."
        )

        # Get generated key moments
        key_moments = (
            db.query(KeyMoment)
            .filter(
                KeyMoment.video_id == VIDEO_ID
            )
            .order_by(
                KeyMoment.start_time
            )
            .all()
        )

        assert key_moments, (
            f"No key moments found "
            f"for video {VIDEO_ID}."
        )

        # Generate report
        report = generate_highlight_report(
            video=video,
            summary=summary,
            key_moments=key_moments
        )

        # Basic validation
        assert report["video_id"] == VIDEO_ID
        assert report["filename"] == video.filename
        assert report["total_highlights"] == len(
            key_moments
        )

        assert report["highlights"]

        # Validate each highlight
        for highlight in report["highlights"]:

            assert "title" in highlight
            assert "start_time" in highlight
            assert "end_time" in highlight
            assert "duration" in highlight
            assert "importance_score" in highlight
            assert "segment_text" in highlight

            assert (
                highlight["end_time"]
                >= highlight["start_time"]
            )

            assert highlight["duration"] >= 0

            assert (
                0.0
                <= highlight["importance_score"]
                <= 1.0
            )

        # Print report for inspection
        print("\n")
        print("=" * 70)
        print("HIGHLIGHT REPORT — VIDEO", VIDEO_ID)
        print("=" * 70)

        print(f"\nFilename: {report['filename']}")
        print(f"Duration: {report['duration']:.2f} seconds")
        print(
            f"Total Highlights: "
            f"{report['total_highlights']}"
        )

        print("\nSummary:")
        print(report["summary"])

        for index, highlight in enumerate(
            report["highlights"],
            start=1
        ):
            print(
                f"\n--- HIGHLIGHT {index} ---"
            )

            print(
                f"Title: "
                f"{highlight['title']}"
            )

            print(
                f"Time: "
                f"{highlight['start_time']:.2f}s - "
                f"{highlight['end_time']:.2f}s"
            )

            print(
                f"Duration: "
                f"{highlight['duration']:.2f}s"
            )

            print(
                f"Importance: "
                f"{highlight['importance_score']}"
            )

            print(
                f"Text: "
                f"{highlight['segment_text']}"
            )

        print("\n" + "=" * 70)

    finally:
        db.close()