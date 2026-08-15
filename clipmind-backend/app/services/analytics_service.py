from sqlalchemy.orm import Session

from app.models.video import Video
from app.models.transcript import Transcript
from app.models.transcript_segment import TranscriptSegment
from app.models.key_moment import KeyMoment
from app.models.keyword import Keyword
from app.models.summary import Summary


def generate_video_analytics(
    db: Session,
    video: Video
):

    # ---------------------------------------------------------
    # 1. Video information
    # ---------------------------------------------------------

    duration = float(
        video.duration or 0
    )

    file_size = int(
        video.file_size or 0
    )

    # ---------------------------------------------------------
    # 2. Transcript
    # ---------------------------------------------------------

    transcript = (
        db.query(Transcript)
        .filter(
            Transcript.video_id == video.id
        )
        .first()
    )

    transcript_available = (
        transcript is not None
    )

    transcript_word_count = 0

    if transcript:
        transcript_word_count = len(
            transcript.transcript_text.split()
        )

    # ---------------------------------------------------------
    # 3. Transcript segments
    # ---------------------------------------------------------

    transcript_segment_count = (
        db.query(TranscriptSegment)
        .filter(
            TranscriptSegment.video_id
            == video.id
        )
        .count()
    )

    # ---------------------------------------------------------
    # 4. Key moments
    # ---------------------------------------------------------

    key_moments = (
        db.query(KeyMoment)
        .filter(
            KeyMoment.video_id
            == video.id
        )
        .all()
    )

    key_moment_count = len(
        key_moments
    )

    if key_moment_count > 0:

        average_key_moment_importance = (
            sum(
                moment.importance_score
                for moment in key_moments
            )
            / key_moment_count
        )

    else:

        average_key_moment_importance = 0.0

    # ---------------------------------------------------------
    # 5. Key moment density
    # ---------------------------------------------------------

    if duration > 0:

        key_moment_density = (
            key_moment_count
            / (duration / 60)
        )

    else:

        key_moment_density = 0.0

    # ---------------------------------------------------------
    # 6. Keywords
    # ---------------------------------------------------------

    keywords = (
        db.query(Keyword)
        .filter(
            Keyword.video_id
            == video.id
        )
        .order_by(
            Keyword.relevance_score.desc()
        )
        .all()
    )

    keyword_count = len(
        keywords
    )

    top_keywords = [
        {
            "keyword": keyword.keyword,
            "frequency": keyword.frequency,
            "relevance_score": keyword.relevance_score
        }
        for keyword in keywords[:10]
    ]

    # ---------------------------------------------------------
    # 7. Summary availability
    # ---------------------------------------------------------

    summaries = (
        db.query(Summary)
        .filter(
            Summary.video_id
            == video.id
        )
        .all()
    )

    short_summary_available = any(
        summary.summary_type == "short"
        for summary in summaries
    )

    detailed_summary_available = any(
        summary.summary_type == "detailed"
        for summary in summaries
    )

    # ---------------------------------------------------------
    # 8. Words per minute
    # ---------------------------------------------------------

    if duration > 0:

        words_per_minute = (
            transcript_word_count
            / (duration / 60)
        )

    else:

        words_per_minute = 0.0

    # ---------------------------------------------------------
    # 9. Return analytics
    # ---------------------------------------------------------

    return {
        "video_id": video.id,

        "duration": round(
            duration,
            2
        ),

        "file_size": file_size,

        "transcript_available":
            transcript_available,

        "transcript_word_count":
            transcript_word_count,

        "transcript_segment_count":
            transcript_segment_count,

        "key_moment_count":
            key_moment_count,

        "average_key_moment_importance":
            round(
                average_key_moment_importance,
                4
            ),

        "key_moment_density":
            round(
                key_moment_density,
                4
            ),

        "keyword_count":
            keyword_count,

        "top_keywords":
            top_keywords,

        "short_summary_available":
            short_summary_available,

        "detailed_summary_available":
            detailed_summary_available,

        "words_per_minute":
            round(
                words_per_minute,
                2
            )
    }