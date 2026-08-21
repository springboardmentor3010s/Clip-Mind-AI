from services.nlp_service import extract_keywords
from services.time_utils import fmt


def build_analytics(segments: list, moments: list, full_text: str):
    """
    Builds AnalyticsResult from real segment/moment data:
      - speakerShare: distribution of segments per speaker label
      - keywords: top frequent terms across the transcript
      - sentimentTimeline: lightweight lexicon-based polarity per segment
      - metrics: headline counters
    """
    totals = {}
    for s in segments:
        totals[s["speaker"]] = totals.get(s["speaker"], 0) + 1
    total_segs = sum(totals.values()) or 1
    speaker_share = [
        {"speaker": speaker, "pct": round((count / total_segs) * 100)}
        for speaker, count in totals.items()
    ]

    keywords = extract_keywords(full_text, top_n=8)

    sentiment_timeline = [
        {"seconds": s["seconds"], "value": _lexicon_sentiment(s["text"])}
        for s in segments
    ]

    duration = segments[-1]["seconds"] if segments else 0
    metrics = [
        {"label": "Segments", "value": str(len(segments))},
        {"label": "Key moments", "value": str(len(moments))},
        {"label": "Speakers", "value": str(len(speaker_share))},
        {"label": "Duration", "value": fmt(duration)},
    ]

    return {
        "speakerShare": speaker_share,
        "keywords": keywords,
        "sentimentTimeline": sentiment_timeline,
        "metrics": metrics,
    }


_POSITIVE = {
    "good", "great", "excellent", "positive", "improve", "improved", "success", "successful",
    "clear", "strong", "helpful", "effective", "accurate", "better", "best", "gain", "progress",
    "agree", "benefit", "advantage", "well", "works", "working", "solid", "robust",
}
_NEGATIVE = {
    "bad", "poor", "negative", "fail", "failed", "failure", "issue", "issues", "problem",
    "problems", "weak", "difficult", "error", "errors", "wrong", "worse", "worst", "concern",
    "concerns", "risk", "risky", "noisy", "degrade", "degrades", "limitation", "limitations",
}


def _lexicon_sentiment(text: str) -> float:
    """
    Simple bounded lexicon-based polarity score in [0, 1], centered at 0.5.
    Not a substitute for a trained sentiment model, but real and deterministic
    (no random numbers), unlike the mock engine it replaces.
    """
    words = [w.lower() for w in text.replace(",", " ").replace(".", " ").split()]
    if not words:
        return 0.5
    pos = sum(1 for w in words if w in _POSITIVE)
    neg = sum(1 for w in words if w in _NEGATIVE)
    if pos == 0 and neg == 0:
        return 0.5
    score = 0.5 + 0.5 * ((pos - neg) / max(1, pos + neg))
    return round(max(0.0, min(1.0, score)), 2)


def aggregate_analytics(video_records: list):
    """Aggregate keywords/metrics across every processed video (for GET /analytics with no videoId)."""
    keyword_totals = {}
    total_duration = 0
    total_moments = 0
    total_segments = 0
    for v in video_records:
        total_duration += v.get("durationSeconds", 0)
        total_moments += len(v.get("moments") or [])
        total_segments += len(v.get("transcript") or [])
        analytics = v.get("analytics") or {}
        for kw in analytics.get("keywords", []):
            keyword_totals[kw["term"]] = keyword_totals.get(kw["term"], 0) + kw["count"]

    keywords = sorted(
        [{"term": t, "count": c} for t, c in keyword_totals.items()],
        key=lambda x: x["count"], reverse=True,
    )[:8]

    return {
        "speakerShare": [],
        "keywords": keywords,
        "sentimentTimeline": [],
        "metrics": [
            {"label": "Recordings", "value": str(len(video_records))},
            {"label": "Total duration", "value": fmt(total_duration)},
            {"label": "Key moments", "value": str(total_moments)},
            {"label": "Segments", "value": str(total_segments)},
        ],
    }
