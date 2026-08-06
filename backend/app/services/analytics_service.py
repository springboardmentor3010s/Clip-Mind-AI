import json

from sqlalchemy.orm import Session

from app.models.video import Video
from app.models.transcript import Transcript


def parse_duration(duration):

    """
    Converts HH:MM:SS or MM:SS to seconds
    """

    if not duration:
        return 0

    try:

        parts = [int(x) for x in duration.split(":")]

        if len(parts) == 3:

            h, m, s = parts

            return h * 3600 + m * 60 + s

        if len(parts) == 2:

            m, s = parts

            return m * 60 + s

    except Exception:

        return 0

    return 0


def get_dashboard_analytics(
    db: Session,
    educator_id: int
):

    videos = (
        db.query(Video)
        .filter(Video.user_id == educator_id)
        .all()
    )

    total_videos = len(videos)

    completed = 0
    processing = 0
    failed = 0

    total_views = 0

    total_duration = 0

    transcript_words = 0
    summary_words = 0

    topics_generated = 0
    quiz_questions = 0
    flashcards = 0
    key_moments = 0

    # -----------------------------
    # Insight trackers
    # -----------------------------

    most_viewed = {"title": None, "value": -1}
    least_viewed = {"title": None, "value": None}
    most_topics = {"title": None, "value": -1}
    most_quiz = {"title": None, "value": -1}
    most_keymoments = {"title": None, "value": -1}

    for video in videos:

        # -----------------------------
        # Status
        # -----------------------------

        if video.status == "Completed":

            completed += 1

        elif video.status == "Processing":

            processing += 1

        elif video.status == "Failed":

            failed += 1

        # -----------------------------
        # Views
        # -----------------------------

        video_views = video.views or 0

        total_views += video_views

        if video_views > most_viewed["value"]:

            most_viewed = {
                "title": video.title,
                "value": video_views
            }

        if (
            least_viewed["value"] is None
            or video_views < least_viewed["value"]
        ):

            least_viewed = {
                "title": video.title,
                "value": video_views
            }

        # -----------------------------
        # Duration
        # -----------------------------

        total_duration += parse_duration(
            video.duration
        )

        # -----------------------------
        # Summary Words
        # -----------------------------

        if video.summary:

            summary_words += len(
                video.summary.split()
            )

        # -----------------------------
        # Topics Count
        # -----------------------------

        video_topics_count = 0

        if video.topics:

            try:

                video_topics_count = len(
                    json.loads(video.topics)
                )

            except Exception:

                video_topics_count = 0

        topics_generated += video_topics_count

        if video_topics_count > most_topics["value"]:

            most_topics = {
                "title": video.title,
                "value": video_topics_count
            }

        # -----------------------------
        # Quiz Count
        # -----------------------------

        video_quiz_count = 0

        if video.quiz:

            try:

                video_quiz_count = len(
                    json.loads(video.quiz)
                )

            except Exception:

                video_quiz_count = 0

        quiz_questions += video_quiz_count

        if video_quiz_count > most_quiz["value"]:

            most_quiz = {
                "title": video.title,
                "value": video_quiz_count
            }

        # -----------------------------
        # Flashcards Count
        # -----------------------------

        if video.flashcards:

            try:

                flashcards += len(
                    json.loads(video.flashcards)
                )

            except Exception:

                pass

        # -----------------------------
        # Key Moments Count
        # -----------------------------

        video_keymoments_count = 0

        if video.key_moments:

            try:

                video_keymoments_count = len(
                    json.loads(video.key_moments)
                )

            except Exception:

                video_keymoments_count = 0

        key_moments += video_keymoments_count

        if video_keymoments_count > most_keymoments["value"]:

            most_keymoments = {
                "title": video.title,
                "value": video_keymoments_count
            }

        # -----------------------------
        # Transcript Words
        # -----------------------------

        transcript = (
            db.query(Transcript)
            .filter(
                Transcript.video_id == video.id
            )
            .first()
        )

        if transcript:

            transcript_words += len(
                transcript.transcript_text.split()
            )

    success_rate = 0

    if total_videos > 0:

        success_rate = round(
            completed * 100 / total_videos,
            2
        )

    avg_duration = 0

    if total_videos > 0:

        avg_duration = round(
            total_duration / total_videos,
            2
        )

    avg_views = 0

    if total_videos > 0:

        avg_views = round(
            total_views / total_videos,
            2
        )

    return {

        "total_videos": total_videos,

        "completed": completed,

        "processing": processing,

        "failed": failed,

        "success_rate": success_rate,

        "total_views": total_views,

        "average_views": avg_views,

        "total_duration_seconds": total_duration,

        "average_duration_seconds": avg_duration,

        "transcript_words": transcript_words,

        "summary_words": summary_words,

        "topics_generated": topics_generated,

        "quiz_questions": quiz_questions,

        "flashcards": flashcards,

        "key_moments": key_moments,

        "insights": {

            "most_viewed": most_viewed,

            "least_viewed": least_viewed,

            "most_topics": most_topics,

            "most_quiz": most_quiz,

            "most_keymoments": most_keymoments

        }

    }