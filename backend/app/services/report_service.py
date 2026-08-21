from app.models import Video

def generate_report(video: Video):
    transcript = video.transcript or ""
    summary = video.summary or ""
    key_moments = video.key_moments or []
    keywords = video.keywords or []
    topics = video.topics or []

    report = {
        "video_name": video.original_filename,
        "status": video.status,

        "transcript": transcript,
        "summary": summary,

        "transcript_word_count": len(transcript.split()),
        "summary_word_count": len(summary.split()),

        "keywords": keywords,
        "key_moments": key_moments,
        "topics": topics,
    }

    return report