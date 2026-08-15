from app.database.connection import SessionLocal

from app.models.user import User
from app.models.video import Video
from app.models.activity_history import ActivityHistory
from app.models.transcript import Transcript
from app.models.summary import Summary
from app.models.transcript_segment import TranscriptSegment
from app.models.key_moment import KeyMoment
from app.models.keyword import Keyword

from app.services.usage_analytics_service import (
    generate_usage_analytics
)


VIDEO_ID = 44


def test_generate_usage_analytics():

    db = SessionLocal()

    try:
        # -----------------------------------------------------
        # 1. Get an existing video
        # -----------------------------------------------------

        video = (
            db.query(Video)
            .filter(
                Video.id == VIDEO_ID
            )
            .first()
        )

        assert video is not None, (
            f"Video {VIDEO_ID} was not found."
        )

        # -----------------------------------------------------
        # 2. Generate usage analytics
        #    using the video's owner
        # -----------------------------------------------------

        analytics = generate_usage_analytics(
            db=db,
            owner_id=video.owner_id
        )

        # -----------------------------------------------------
        # 3. Basic validation
        # -----------------------------------------------------

        assert analytics is not None

        assert (
            analytics["total_videos"]
            >= 1
        )

        assert (
            analytics["total_video_duration"]
            >= 0
        )

        assert (
            analytics["average_video_duration"]
            >= 0
        )

        assert (
            analytics["total_transcript_words"]
            >= 0
        )

        assert (
            analytics["total_transcript_segments"]
            >= 0
        )

        assert (
            analytics["total_key_moments"]
            >= 0
        )

        assert (
            analytics["total_keywords"]
            >= 0
        )

        assert (
            analytics["total_summaries"]
            >= 0
        )

        assert (
            analytics[
                "average_key_moments_per_video"
            ] >= 0
        )

        assert isinstance(
            analytics[
                "most_frequent_keywords"
            ],
            list
        )

        # -----------------------------------------------------
        # 4. Print results
        # -----------------------------------------------------

        print("\n")
        print("=" * 70)
        print("USAGE ANALYTICS")
        print("=" * 70)

        print(
            f"\nTotal videos: "
            f"{analytics['total_videos']}"
        )

        print(
            f"Total video duration: "
            f"{analytics['total_video_duration']} sec"
        )

        print(
            f"Average video duration: "
            f"{analytics['average_video_duration']} sec"
        )

        print(
            f"Total transcript words: "
            f"{analytics['total_transcript_words']}"
        )

        print(
            f"Total transcript segments: "
            f"{analytics['total_transcript_segments']}"
        )

        print(
            f"Total key moments: "
            f"{analytics['total_key_moments']}"
        )

        print(
            f"Total keywords: "
            f"{analytics['total_keywords']}"
        )

        print(
            f"Total summaries: "
            f"{analytics['total_summaries']}"
        )

        print(
            f"Average key moments/video: "
            f"{analytics['average_key_moments_per_video']}"
        )

        print("\nMost frequent keywords:")

        for index, item in enumerate(
            analytics[
                "most_frequent_keywords"
            ],
            start=1
        ):

            print(
                f"{index}. "
                f"{item['keyword']} "
                f"→ "
                f"{item['total_frequency']}"
            )

        print("\n" + "=" * 70)

    finally:
        db.close()