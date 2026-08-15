from app.database.connection import SessionLocal

from app.models.user import User
from app.models.video import Video
from app.models.activity_history import ActivityHistory
from app.models.transcript import Transcript
from app.models.summary import Summary
from app.models.transcript_segment import TranscriptSegment
from app.models.key_moment import KeyMoment
from app.models.keyword import Keyword

from app.services.keyword_extraction_service import (
    extract_keywords
)


VIDEO_ID = 44


def test_extract_keywords_from_real_video():

    db = SessionLocal()

    try:
        # -----------------------------------------------------
        # 1. Get Video
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
        # 2. Get Transcript Segments
        # -----------------------------------------------------

        segments = (
            db.query(TranscriptSegment)
            .filter(
                TranscriptSegment.video_id
                == VIDEO_ID
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

        # -----------------------------------------------------
        # 3. Extract keywords
        # -----------------------------------------------------

        keywords = extract_keywords(
            segments=segments,
            max_keywords=15
        )

        # -----------------------------------------------------
        # 4. Validate results
        # -----------------------------------------------------

        assert keywords, (
            "No keywords were extracted."
        )

        assert len(keywords) <= 15

        for item in keywords:

            assert "keyword" in item
            assert "frequency" in item
            assert "relevance_score" in item

            assert item["keyword"]

            assert item["frequency"] >= 1

            assert (
                0.0
                <= item["relevance_score"]
                <= 1.0
            )

        # -----------------------------------------------------
        # 5. Print results
        # -----------------------------------------------------

        print("\n")
        print("=" * 70)
        print(
            "KEYWORD EXTRACTION — VIDEO",
            VIDEO_ID
        )
        print("=" * 70)

        for index, item in enumerate(
            keywords,
            start=1
        ):

            print(
                f"\nKEYWORD {index}"
            )

            print(
                f"Keyword: "
                f"{item['keyword']}"
            )

            print(
                f"Frequency: "
                f"{item['frequency']}"
            )

            print(
                f"Relevance: "
                f"{item['relevance_score']}"
            )

        print("\n" + "=" * 70)

    finally:
        db.close()