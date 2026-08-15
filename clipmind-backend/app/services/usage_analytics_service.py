from collections import defaultdict

from sqlalchemy.orm import Session

from app.models.video import Video
from app.models.transcript import Transcript
from app.models.transcript_segment import TranscriptSegment
from app.models.key_moment import KeyMoment
from app.models.keyword import Keyword
from app.models.summary import Summary


def generate_usage_analytics(
    db: Session,
    owner_id: int
):

    # ---------------------------------------------------------
    # 1. Get user's videos
    # ---------------------------------------------------------

    videos = (
        db.query(Video)
        .filter(
            Video.owner_id == owner_id
        )
        .all()
    )

    total_videos = len(videos)

    # ---------------------------------------------------------
    # 2. Video duration
    # ---------------------------------------------------------

    total_video_duration = sum(
        float(video.duration or 0)
        for video in videos
    )

    if total_videos > 0:

        average_video_duration = (
            total_video_duration
            / total_videos
        )

    else:

        average_video_duration = 0.0

    # ---------------------------------------------------------
    # 3. Video IDs
    # ---------------------------------------------------------

    video_ids = [
        video.id
        for video in videos
    ]

    # If user has no videos, return zero values.
    if not video_ids:

        return {
            "total_videos": 0,
            "total_video_duration": 0.0,
            "average_video_duration": 0.0,
            "total_transcript_words": 0,
            "total_transcript_segments": 0,
            "total_key_moments": 0,
            "total_keywords": 0,
            "total_summaries": 0,
            "average_key_moments_per_video": 0.0,
            "most_frequent_keywords": []
        }

    # ---------------------------------------------------------
    # 4. Transcript word count
    # ---------------------------------------------------------

    transcripts = (
        db.query(Transcript)
        .filter(
            Transcript.video_id.in_(video_ids)
        )
        .all()
    )

    total_transcript_words = sum(
        len(
            transcript.transcript_text.split()
        )
        for transcript in transcripts
    )

    # ---------------------------------------------------------
    # 5. Transcript segments
    # ---------------------------------------------------------

    total_transcript_segments = (
        db.query(TranscriptSegment)
        .filter(
            TranscriptSegment.video_id.in_(
                video_ids
            )
        )
        .count()
    )

    # ---------------------------------------------------------
    # 6. Key moments
    # ---------------------------------------------------------

    total_key_moments = (
        db.query(KeyMoment)
        .filter(
            KeyMoment.video_id.in_(
                video_ids
            )
        )
        .count()
    )

    if total_videos > 0:

        average_key_moments_per_video = (
            total_key_moments
            / total_videos
        )

    else:

        average_key_moments_per_video = 0.0

    # ---------------------------------------------------------
    # 7. Keywords
    # ---------------------------------------------------------

    keywords = (
        db.query(Keyword)
        .filter(
            Keyword.video_id.in_(
                video_ids
            )
        )
        .all()
    )

    total_keywords = len(
        keywords
    )

    # Aggregate keyword frequency
    keyword_frequency = defaultdict(int)

    for keyword in keywords:

        keyword_frequency[
            keyword.keyword
        ] += keyword.frequency

    sorted_keywords = sorted(
        keyword_frequency.items(),
        key=lambda item: item[1],
        reverse=True
    )

    most_frequent_keywords = [
        {
            "keyword": keyword,
            "total_frequency": frequency
        }
        for keyword, frequency
        in sorted_keywords[:10]
    ]

    # ---------------------------------------------------------
    # 8. Summaries
    # ---------------------------------------------------------

    total_summaries = (
        db.query(Summary)
        .filter(
            Summary.video_id.in_(
                video_ids
            )
        )
        .count()
    )

    # ---------------------------------------------------------
    # 9. Return usage analytics
    # ---------------------------------------------------------

    return {

        "total_videos":
            total_videos,

        "total_video_duration":
            round(
                total_video_duration,
                2
            ),

        "average_video_duration":
            round(
                average_video_duration,
                2
            ),

        "total_transcript_words":
            total_transcript_words,

        "total_transcript_segments":
            total_transcript_segments,

        "total_key_moments":
            total_key_moments,

        "total_keywords":
            total_keywords,

        "total_summaries":
            total_summaries,

        "average_key_moments_per_video":
            round(
                average_key_moments_per_video,
                2
            ),

        "most_frequent_keywords":
            most_frequent_keywords
    }