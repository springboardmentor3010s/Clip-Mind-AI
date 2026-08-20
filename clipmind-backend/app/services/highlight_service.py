import re


def generate_highlight_report(
    video,
    summary,
    key_moments
):
    """
    Build a highlight report containing concise
    key takeaways from the AI-generated summary.

    Key moments are kept separate and are not copied
    into the highlights list.
    """

    summary_text = summary.summary_text.strip()

    # Split the summary into sentences
    sentences = re.split(
        r"(?<=[.!?])\s+",
        summary_text
    )

    # Remove empty sentences
    sentences = [
        sentence.strip()
        for sentence in sentences
        if sentence.strip()
    ]

    # Select up to 5 important takeaways
    highlights = sentences[:5]

    # If the summary does not contain enough sentences,
    # return the available content as highlights
    if not highlights and summary_text:
        highlights = [summary_text]

    return {
        "video_id": video.id,
        "filename": video.filename,
        "duration": video.duration or 0.0,
        "summary": summary_text,
        "total_highlights": len(highlights),
        "highlights": highlights
    }