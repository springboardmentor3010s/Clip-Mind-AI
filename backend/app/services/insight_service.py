import json

from app.models.transcript import Transcript


def safe_json(data):

    if not data:
        return []

    try:
        return json.loads(data)
    except Exception:
        return []


def generate_course_insights(course, db):

    videos = course.videos

    total_videos = len(videos)

    completed = 0
    processing = 0
    failed = 0

    total_topics = 0
    total_flashcards = 0
    total_quiz = 0
    total_keymoments = 0
    total_transcript_words = 0
    total_summary_words = 0

    longest_summary = 0
    richest_lecture = None

    for video in videos:

        if video.status == "Completed":
            completed += 1

        elif video.status == "Processing":
            processing += 1

        elif video.status == "Failed":
            failed += 1

        topics = safe_json(video.topics)
        flashcards = safe_json(video.flashcards)
        quiz = safe_json(video.quiz)
        keymoments = safe_json(video.key_moments)

        total_topics += len(topics)
        total_flashcards += len(flashcards)
        total_quiz += len(quiz)
        total_keymoments += len(keymoments)

        summary_words = len((video.summary or "").split())

        total_summary_words += summary_words

        transcript = (
            db.query(Transcript)
            .filter(Transcript.video_id == video.id)
            .first()
        )

        if transcript:

            total_transcript_words += len(
                transcript.transcript_text.split()
            )

        score = (
            len(topics)
            + len(flashcards)
            + len(quiz)
            + len(keymoments)
        )

        if score > longest_summary:

            longest_summary = score

            richest_lecture = video.title

    avg_topics = round(
        total_topics / total_videos,
        2
    ) if total_videos else 0

    avg_summary = round(
        total_summary_words / total_videos,
        2
    ) if total_videos else 0

    insights = [

        f"{completed} out of {total_videos} lectures have been processed successfully.",

        f"AI extracted {total_topics} learning topics.",

        f"{total_flashcards} flashcards were generated.",

        f"{total_quiz} quiz questions were created.",

        f"{total_keymoments} key learning moments were detected.",

        f"Average topics per lecture: {avg_topics}.",

        f"Average summary length: {avg_summary} words.",

        f"Total transcript size: {total_transcript_words} words.",

    ]

    if richest_lecture:

        insights.append(

            f'Most AI-rich lecture: "{richest_lecture}".'

        )

    usage = {

        "total_lectures": total_videos,

        "completed": completed,

        "processing": processing,

        "failed": failed,

        "topics": total_topics,

        "flashcards": total_flashcards,

        "quiz": total_quiz,

        "key_moments": total_keymoments,

        "transcript_words": total_transcript_words,

        "summary_words": total_summary_words

    }

    return {

        "content_insights": insights,

        "usage_report": usage

    }