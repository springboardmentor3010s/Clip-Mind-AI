def generate_highlight_report(
    video,
    summary,
    key_moments
):
    """
    Build a structured highlight report from
    existing video, summary, and key moment data.
    """

    highlights = []

    for moment in key_moments:
        duration = (
            moment.end_time -
            moment.start_time
        )

        highlights.append({
            "title": moment.title,
            "start_time": moment.start_time,
            "end_time": moment.end_time,
            "duration": round(duration, 2),
            "importance_score": moment.importance_score,
            "segment_text": moment.segment_text
        })

    return {
        "video_id": video.id,
        "filename": video.filename,
        "duration": video.duration or 0.0,
        "summary": summary.summary_text,
        "total_highlights": len(highlights),
        "highlights": highlights
    }