from sqlalchemy.orm import Session

from app.models.video import Video


def generate_answer(question: str, video: Video):

    question = question.lower().strip()

    transcript = video.transcript or ""
    summary = video.summary or ""

    keywords = []

    if video.keywords:
        if isinstance(video.keywords, list):
            keywords = [
                item["keyword"]
                for item in video.keywords
                if "keyword" in item
            ]

    # ------------------------------------------
    # Summary
    # ------------------------------------------

    if any(word in question for word in [
        "summary",
        "summarize",
        "overview",
        "about"
    ]):

        return summary if summary else "Summary is not available."

    # ------------------------------------------
    # Keywords
    # ------------------------------------------

    elif any(word in question for word in [
        "keyword",
        "keywords",
        "important words"
    ]):

        if keywords:
            return "Keywords: " + ", ".join(keywords)

        return "No keywords available."

    # ------------------------------------------
    # Key Moments
    # ------------------------------------------

    elif any(word in question for word in [
        "moment",
        "moments",
        "highlight",
        "highlights"
    ]):

        if video.key_moments:

            moments = []

            for item in video.key_moments:

                moments.append(
                    f"{item['timestamp']} - {item['text']}"
                )

            return "\n".join(moments)

        return "No key moments available."

    # ------------------------------------------
    # Transcript
    # ------------------------------------------

    elif any(word in question for word in [
        "transcript",
        "full text",
        "speech"
    ]):

        return transcript if transcript else "Transcript not available."

    # ------------------------------------------
    # Duration
    # ------------------------------------------

    elif any(word in question for word in [
        "duration",
        "length"
    ]):

        return f"The video duration is {video.duration:.2f} seconds."

    # ------------------------------------------
    # Default
    # ------------------------------------------

    else:

        if summary:
            return (
                "I couldn't find an exact answer.\n\n"
                "Here is the video summary:\n\n"
                + summary
            )

        return (
            "Sorry, I couldn't answer your question "
            "because no summary is available."
        )


# ==========================================
# Chat Service
# ==========================================

def chat_with_video(
    db: Session,
    video_id: int,
    question: str
):

    video = db.query(Video).filter(
        Video.id == video_id
    ).first()

    if not video:
        return {
            "success": False,
            "message": "Video not found."
        }

    answer = generate_answer(question, video)

    return {
        "success": True,
        "video_id": video.id,
        "title": video.title,
        "question": question,
        "answer": answer
    }