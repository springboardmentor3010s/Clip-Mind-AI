import io
import json

from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
)

from app.models.video import Video
from app.models.transcript import Transcript
from app.models.course import Course
from app.services.analytics_service import get_dashboard_analytics


styles = getSampleStyleSheet()


def _safe_json(data):

    if not data:

        return []

    try:

        return json.loads(data)

    except Exception:

        return []


def generate_lecture_report(db, video_id):

    video = (
        db.query(Video)
        .filter(Video.id == video_id)
        .first()
    )

    if not video:

        return None

    transcript = (
        db.query(Transcript)
        .filter(
            Transcript.video_id == video.id
        )
        .first()
    )

    buffer = io.BytesIO()

    doc = SimpleDocTemplate(buffer)

    story = []

    # -----------------------------------------
    # Title
    # -----------------------------------------

    story.append(
        Paragraph(
            "<b>ClipMind AI Lecture Report</b>",
            styles["Title"]
        )
    )

    story.append(Spacer(1, 20))

    # -----------------------------------------
    # Lecture Details
    # -----------------------------------------

    story.append(
        Paragraph(
            f"<b>Lecture :</b> {video.title}",
            styles["Heading2"]
        )
    )

    story.append(
        Paragraph(
            f"<b>Description :</b> {video.description or '-'}",
            styles["BodyText"]
        )
    )

    story.append(
        Paragraph(
            f"<b>Category :</b> {video.category}",
            styles["BodyText"]
        )
    )

    story.append(
        Paragraph(
            f"<b>Duration :</b> {video.duration}",
            styles["BodyText"]
        )
    )

    story.append(
        Paragraph(
            f"<b>Status :</b> {video.status}",
            styles["BodyText"]
        )
    )

    story.append(Spacer(1, 15))

    # -----------------------------------------
    # Transcript
    # -----------------------------------------

    story.append(
        Paragraph(
            "<b>Transcript</b>",
            styles["Heading1"]
        )
    )

    if transcript:

        story.append(
            Paragraph(
                transcript.transcript_text,
                styles["BodyText"]
            )
        )

    else:

        story.append(
            Paragraph(
                "Transcript not available.",
                styles["BodyText"]
            )
        )

    story.append(Spacer(1, 20))

    # -----------------------------------------
    # Summary
    # -----------------------------------------

    story.append(
        Paragraph(
            "<b>Summary</b>",
            styles["Heading1"]
        )
    )

    story.append(
        Paragraph(
            video.summary or "-",
            styles["BodyText"]
        )
    )

    story.append(Spacer(1, 20))

    # -----------------------------------------
    # Topics
    # -----------------------------------------

    story.append(
        Paragraph(
            "<b>Topics</b>",
            styles["Heading1"]
        )
    )

    for topic in _safe_json(video.topics):

        story.append(

            Paragraph(

                f"• {topic}",

                styles["BodyText"]

            )

        )

    story.append(Spacer(1, 20))

    # -----------------------------------------
    # Key Moments
    # -----------------------------------------

    story.append(

        Paragraph(

            "<b>Key Moments</b>",

            styles["Heading1"]

        )

    )

    for moment in _safe_json(video.key_moments):

        story.append(

            Paragraph(

                f"{moment.get('time')} - {moment.get('title')}",

                styles["BodyText"]

            )

        )

    story.append(Spacer(1, 20))

    # -----------------------------------------
    # Flashcards
    # -----------------------------------------

    story.append(

        Paragraph(

            "<b>Flashcards</b>",

            styles["Heading1"]

        )

    )

    for flashcard in _safe_json(video.flashcards):

        story.append(

            Paragraph(

                f"<b>Q:</b> {flashcard.get('front')}<br/><b>A:</b> {flashcard.get('back')}",

                styles["BodyText"]

            )

        )

    story.append(Spacer(1, 20))

    # -----------------------------------------
    # Quiz
    # -----------------------------------------

    story.append(

        Paragraph(

            "<b>Quiz</b>",

            styles["Heading1"]

        )

    )

    for i, quiz in enumerate(_safe_json(video.quiz), start=1):

        story.append(

            Paragraph(

                f"{i}. {quiz.get('question')}",

                styles["BodyText"]

            )

        )

    story.append(Spacer(1, 20))

    # -----------------------------------------
    # Analytics
    # -----------------------------------------

    transcript_words = 0

    if transcript:

        transcript_words = len(

            transcript.transcript_text.split()

        )

    summary_words = len(

        (video.summary or "").split()

    )

    story.append(

        Paragraph(

            "<b>Lecture Analytics</b>",

            styles["Heading1"]

        )

    )

    story.append(

        Paragraph(

            f"Transcript Words : {transcript_words}",

            styles["BodyText"]

        )

    )

    story.append(

        Paragraph(

            f"Summary Words : {summary_words}",

            styles["BodyText"]

        )

    )

    story.append(

        Paragraph(

            f"Quiz Questions : {len(_safe_json(video.quiz))}",

            styles["BodyText"]

        )

    )

    story.append(

        Paragraph(

            f"Flashcards : {len(_safe_json(video.flashcards))}",

            styles["BodyText"]

        )

    )

    story.append(

        Paragraph(

            f"Key Moments : {len(_safe_json(video.key_moments))}",

            styles["BodyText"]

        )

    )

    story.append(

        Paragraph(

            f"Views : {video.views}",

            styles["BodyText"]

        )

    )

    doc.build(story)

    buffer.seek(0)

    return buffer


def generate_course_report(db, course_id):

    course = (
        db.query(Course)
        .filter(Course.id == course_id)
        .first()
    )

    if not course:

        return None

    videos = course.videos

    completed = 0
    processing = 0
    failed = 0

    total_views = 0
    total_topics = 0
    total_flashcards = 0
    total_quiz = 0
    total_keymoments = 0

    for video in videos:

        if video.status == "Completed":
            completed += 1

        elif video.status == "Processing":
            processing += 1

        elif video.status == "Failed":
            failed += 1

        total_views += video.views or 0

        total_topics += len(_safe_json(video.topics))

        total_flashcards += len(_safe_json(video.flashcards))

        total_quiz += len(_safe_json(video.quiz))

        total_keymoments += len(_safe_json(video.key_moments))

    buffer = io.BytesIO()

    doc = SimpleDocTemplate(buffer)

    story = []

    story.append(
        Paragraph(
            "<b>ClipMind AI Course Report</b>",
            styles["Title"]
        )
    )

    story.append(Spacer(1, 20))

    story.append(
        Paragraph(
            f"<b>Course :</b> {course.title}",
            styles["Heading2"]
        )
    )

    story.append(
        Paragraph(
            f"<b>Description :</b> {course.description or '-'}",
            styles["BodyText"]
        )
    )

    story.append(
        Paragraph(
            f"<b>Category :</b> {course.category}",
            styles["BodyText"]
        )
    )

    story.append(
        Paragraph(
            f"<b>Difficulty :</b> {course.difficulty}",
            styles["BodyText"]
        )
    )

    story.append(Spacer(1, 20))

    # -----------------------------------------
    # Course Statistics
    # -----------------------------------------

    story.append(
        Paragraph(
            "<b>Course Statistics</b>",
            styles["Heading1"]
        )
    )

    story.append(
        Paragraph(
            f"Total Lectures : {len(videos)}",
            styles["BodyText"]
        )
    )

    story.append(
        Paragraph(
            f"Completed : {completed}",
            styles["BodyText"]
        )
    )

    story.append(
        Paragraph(
            f"Processing : {processing}",
            styles["BodyText"]
        )
    )

    story.append(
        Paragraph(
            f"Failed : {failed}",
            styles["BodyText"]
        )
    )

    story.append(
        Paragraph(
            f"Total Views : {total_views}",
            styles["BodyText"]
        )
    )

    story.append(
        Paragraph(
            f"Topics Generated : {total_topics}",
            styles["BodyText"]
        )
    )

    story.append(
        Paragraph(
            f"Flashcards : {total_flashcards}",
            styles["BodyText"]
        )
    )

    story.append(
        Paragraph(
            f"Quiz Questions : {total_quiz}",
            styles["BodyText"]
        )
    )

    story.append(
        Paragraph(
            f"Key Moments : {total_keymoments}",
            styles["BodyText"]
        )
    )

    story.append(Spacer(1, 20))

    # -----------------------------------------
    # Lectures (detailed)
    # -----------------------------------------

    story.append(
        Paragraph(
            "<b>Lectures</b>",
            styles["Heading1"]
        )
    )

    for lecture in videos:

        story.append(

            Paragraph(

                f"<b>{lecture.title}</b>",

                styles["Heading2"]

            )

        )

        story.append(

            Paragraph(

                f"Status : {lecture.status}",

                styles["BodyText"]

            )

        )

        story.append(

            Paragraph(

                f"Duration : {lecture.duration}",

                styles["BodyText"]

            )

        )

        story.append(

            Paragraph(

                f"Views : {lecture.views}",

                styles["BodyText"]

            )

        )

        story.append(

            Paragraph(

                f"Topics : {len(_safe_json(lecture.topics))}",

                styles["BodyText"]

            )

        )

        story.append(

            Paragraph(

                f"Quiz : {len(_safe_json(lecture.quiz))}",

                styles["BodyText"]

            )

        )

        story.append(

            Paragraph(

                f"Flashcards : {len(_safe_json(lecture.flashcards))}",

                styles["BodyText"]

            )

        )

        story.append(

            Paragraph(

                f"Key Moments : {len(_safe_json(lecture.key_moments))}",

                styles["BodyText"]

            )

        )

        story.append(Spacer(1, 15))

    # -----------------------------------------
    # Course Insights
    # -----------------------------------------

    story.append(

        Paragraph(

            "<b>Course Insights</b>",

            styles["Heading1"]

        )

    )

    story.append(

        Paragraph(

            f"• {completed} lectures completed successfully.",

            styles["BodyText"]

        )

    )

    story.append(

        Paragraph(

            f"• {total_topics} AI topics extracted.",

            styles["BodyText"]

        )

    )

    story.append(

        Paragraph(

            f"• {total_flashcards} flashcards generated.",

            styles["BodyText"]

        )

    )

    story.append(

        Paragraph(

            f"• {total_quiz} quiz questions generated.",

            styles["BodyText"]

        )

    )

    story.append(

        Paragraph(

            f"• {total_keymoments} key moments detected.",

            styles["BodyText"]

        )

    )

    story.append(

        Paragraph(

            f"• Total learner views : {total_views}.",

            styles["BodyText"]

        )

    )

    doc.build(story)

    buffer.seek(0)

    return buffer


def _build_recommendations(stats):

    """
    Simple rule-based recommendations derived
    from the aggregated dashboard stats.
    """

    recommendations = []

    insights = stats["insights"]

    most_viewed = insights["most_viewed"]

    if most_viewed["title"]:

        recommendations.append(
            f"{most_viewed['title']} is the most engaging lecture."
        )

    total_videos = stats["total_videos"]

    if total_videos > 0:

        avg_keymoments = stats["key_moments"] / total_videos

        if avg_keymoments < 3:

            recommendations.append(
                "Consider adding more key moments to shorter lectures."
            )

    if stats["flashcards"] > 0:

        recommendations.append(
            f"AI generated {stats['flashcards']} flashcards across all lectures."
        )

    if total_videos > 0:

        avg_topics = round(
            stats["topics_generated"] / total_videos,
            1
        )

        if avg_topics >= 5:

            recommendations.append(
                f"Course coverage is good with {avg_topics} topics per lecture."
            )

        else:

            recommendations.append(
                "Consider adding more topics per lecture for better coverage."
            )

    if stats["failed"] > 0:

        recommendations.append(
            f"{stats['failed']} lecture(s) failed processing and may need review."
        )

    if not recommendations:

        recommendations.append(
            "Upload more lectures to unlock personalized recommendations."
        )

    return recommendations


def generate_analytics_report(db, educator_id):

    stats = get_dashboard_analytics(db, educator_id)

    if stats["total_videos"] == 0:

        return None

    insights = stats["insights"]

    buffer = io.BytesIO()

    doc = SimpleDocTemplate(buffer)

    story = []

    story.append(
        Paragraph(
            "<b>ClipMind AI Analytics Report</b>",
            styles["Title"]
        )
    )

    story.append(Spacer(1, 20))

    # -----------------------------------------
    # 1. Dashboard Overview
    # -----------------------------------------

    story.append(
        Paragraph(
            "<b>Dashboard Overview</b>",
            styles["Heading1"]
        )
    )

    story.append(
        Paragraph(
            f"Total Videos : {stats['total_videos']}",
            styles["BodyText"]
        )
    )

    story.append(
        Paragraph(
            f"Completed : {stats['completed']}",
            styles["BodyText"]
        )
    )

    story.append(
        Paragraph(
            f"Failed : {stats['failed']}",
            styles["BodyText"]
        )
    )

    story.append(
        Paragraph(
            f"Processing : {stats['processing']}",
            styles["BodyText"]
        )
    )

    story.append(Spacer(1, 20))

    # -----------------------------------------
    # 2. AI Content Statistics
    # -----------------------------------------

    story.append(
        Paragraph(
            "<b>AI Content Statistics</b>",
            styles["Heading1"]
        )
    )

    story.append(
        Paragraph(
            f"Topics Generated : {stats['topics_generated']}",
            styles["BodyText"]
        )
    )

    story.append(
        Paragraph(
            f"Quiz Questions : {stats['quiz_questions']}",
            styles["BodyText"]
        )
    )

    story.append(
        Paragraph(
            f"Flashcards : {stats['flashcards']}",
            styles["BodyText"]
        )
    )

    story.append(
        Paragraph(
            f"Key Moments : {stats['key_moments']}",
            styles["BodyText"]
        )
    )

    story.append(
        Paragraph(
            f"Transcript Words : {stats['transcript_words']}",
            styles["BodyText"]
        )
    )

    story.append(
        Paragraph(
            f"Summary Words : {stats['summary_words']}",
            styles["BodyText"]
        )
    )

    story.append(Spacer(1, 20))

    # -----------------------------------------
    # 3. Content Insights
    # -----------------------------------------

    story.append(
        Paragraph(
            "<b>Content Insights</b>",
            styles["Heading1"]
        )
    )

    story.append(
        Paragraph(
            f"⭐ Most Viewed Lecture : {insights['most_viewed']['title']} "
            f"({insights['most_viewed']['value']} views)",
            styles["BodyText"]
        )
    )

    story.append(
        Paragraph(
            f"⭐ Least Viewed Lecture : {insights['least_viewed']['title']} "
            f"({insights['least_viewed']['value']} views)",
            styles["BodyText"]
        )
    )

    story.append(
        Paragraph(
            f"⭐ Lecture with Most Topics : {insights['most_topics']['title']} "
            f"({insights['most_topics']['value']} topics)",
            styles["BodyText"]
        )
    )

    story.append(
        Paragraph(
            f"⭐ Lecture with Most Key Moments : {insights['most_keymoments']['title']} "
            f"({insights['most_keymoments']['value']} key moments)",
            styles["BodyText"]
        )
    )

    story.append(
        Paragraph(
            f"⭐ Lecture with Most Quiz Questions : {insights['most_quiz']['title']} "
            f"({insights['most_quiz']['value']} questions)",
            styles["BodyText"]
        )
    )

    story.append(Spacer(1, 20))

    # -----------------------------------------
    # 4. AI Recommendations
    # -----------------------------------------

    story.append(
        Paragraph(
            "<b>AI Recommendations</b>",
            styles["Heading1"]
        )
    )

    for recommendation in _build_recommendations(stats):

        story.append(
            Paragraph(
                f"✓ {recommendation}",
                styles["BodyText"]
            )
        )

    story.append(Spacer(1, 20))

    # -----------------------------------------
    # 5. Processing Statistics
    # -----------------------------------------

    story.append(
        Paragraph(
            "<b>Processing Statistics</b>",
            styles["Heading1"]
        )
    )

    story.append(
        Paragraph(
            f"Completed : {stats['completed']}",
            styles["BodyText"]
        )
    )

    story.append(
        Paragraph(
            f"Failed : {stats['failed']}",
            styles["BodyText"]
        )
    )

    story.append(
        Paragraph(
            f"Processing : {stats['processing']}",
            styles["BodyText"]
        )
    )

    story.append(
        Paragraph(
            f"Completion Rate : {stats['success_rate']}%",
            styles["BodyText"]
        )
    )

    doc.build(story)

    buffer.seek(0)

    return buffer