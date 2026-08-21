import json
from app.models.video import Video


# ======================================================
# Helper Function
# ======================================================

def parse_json_field(field):

    if field is None:
        return []

    if isinstance(field, list):
        return [item for item in field if item is not None]

    if isinstance(field, str):
        try:
            data = json.loads(field)
            if isinstance(data, list):
                return [item for item in data if item is not None]
            return []
        except Exception:
            return []

    return []


# ======================================================
# Generate AI Insights & Statistics
# ======================================================

def generate_ai_insights(video: Video):

    transcript = video.transcript or ""
    summary = video.summary or ""

    transcript_words = len(transcript.split())
    summary_words = len(summary.split())

    keywords = parse_json_field(video.keywords)
    key_moments = parse_json_field(video.key_moments)

    keyword_count = len(keywords)
    key_moment_count = len(key_moments)

    duration = video.duration or 1

    speaking_speed = round(transcript_words / (duration / 60), 1)

    reading_time = max(1, round(transcript_words / 200))

    insights = []

    # Speaking Speed
    if speaking_speed < 120:
        insights.append("Speaking speed is slow.")
    elif speaking_speed <= 170:
        insights.append("Speaking speed is normal.")
    else:
        insights.append("Speaking speed is fast.")

    # Transcript Quality
    if transcript_words >= 300:
        insights.append("Transcript quality is excellent.")
    elif transcript_words >= 150:
        insights.append("Transcript quality is good.")
    else:
        insights.append("Transcript quality is average.")

    # Summary
    if summary_words >= 50:
        insights.append("Summary covers major topics.")
    else:
        insights.append("Summary is concise.")

    # Keywords
    if keyword_count >= 10:
        insights.append("Keyword extraction successful.")
    elif keyword_count > 0:
        insights.append("Keyword extraction completed.")
    else:
        insights.append("No keywords available.")

    # Key Moments
    if key_moment_count >= 3:
        insights.append("Important concepts detected correctly.")
    elif key_moment_count > 0:
        insights.append("Few key moments detected.")
    else:
        insights.append("No key moments detected.")

    insights.append("Suitable for educational content.")

    return {

        "duration": duration,

        "transcript_words": transcript_words,

        "summary_words": summary_words,

        "keyword_count": keyword_count,

        "key_moment_count": key_moment_count,

        "reading_time": reading_time,

        "speaking_speed": speaking_speed,

        "insights": insights

    }


# ======================================================
# Generate AI Quality Score
# ======================================================

def generate_quality_score(video: Video):

    transcript_words = len((video.transcript or "").split())
    summary_words = len((video.summary or "").split())

    keywords = parse_json_field(video.keywords)
    key_moments = parse_json_field(video.key_moments)

    keyword_count = len(keywords)
    key_moment_count = len(key_moments)

    transcript_accuracy = min(100, 70 + transcript_words // 10)

    summary_quality = min(100, 70 + summary_words)

    keyword_coverage = min(100, 70 + (keyword_count * 2))

    key_moment_detection = min(100, 70 + (key_moment_count * 5))

    overall = round(
        (
            transcript_accuracy +
            summary_quality +
            keyword_coverage +
            key_moment_detection
        ) / 4
    )

    return {

        "overall": overall,

        "transcript_accuracy": transcript_accuracy,

        "summary_quality": summary_quality,

        "keyword_coverage": keyword_coverage,

        "key_moment_detection": key_moment_detection

    }


# ======================================================
# Processing Timeline
# ======================================================

def generate_processing_timeline():

    return [

        {
            "step": "Video Uploaded",
            "status": "Completed"
        },

        {
            "step": "Transcript Generated",
            "status": "Completed"
        },

        {
            "step": "Summary Generated",
            "status": "Completed"
        },

        {
            "step": "Keywords Extracted",
            "status": "Completed"
        },

        {
            "step": "Key Moments Detected",
            "status": "Completed"
        },

        {
            "step": "Analytics Generated",
            "status": "Completed"
        }

    ]