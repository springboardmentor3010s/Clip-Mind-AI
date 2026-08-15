"""
Advanced features: AI chat over transcript, video similarity,
sentiment timeline, and multi-video search.
"""

import re
from collections import Counter

POSITIVE_WORDS = set("good great excellent amazing love best happy positive success win benefit improve easy helpful powerful exciting wonderful fantastic".split())
NEGATIVE_WORDS = set("bad worst terrible hate problem fail difficult negative risk danger issue concern worry threat harm loss struggle challenge".split())


def answer_question(question: str, transcript_text: str, qa_pipeline) -> str:
    """
    Uses a text2text model (Flan-T5) with the transcript as context to
    answer a natural-language question about the video.
    """
    context = transcript_text[:3000]  # keep prompt within model limits
    prompt = f"Answer the question based only on the context below.\n\nContext: {context}\n\nQuestion: {question}\nAnswer:"
    result = qa_pipeline(prompt, max_length=150, do_sample=False)[0]["generated_text"]
    return result.strip()


def compute_similarity(target_keywords: list, other_keywords: list) -> float:
    """
    Simple keyword-overlap based similarity score between two videos'
    top keyword sets, returned as a percentage.
    """
    target_words = {k["word"].lower() for k in target_keywords}
    other_words = {k["word"].lower() for k in other_keywords}
    if not target_words or not other_words:
        return 0.0
    overlap = target_words & other_words
    union = target_words | other_words
    return round(len(overlap) / len(union) * 100, 1)


def sentiment_timeline(segments: list) -> list:
    """
    Assigns a simple positive/negative/neutral score to each segment
    using a keyword-based polarity lexicon (fast, no extra model).
    """
    timeline = []
    for seg in segments:
        words = re.findall(r"[a-z']+", seg["text"].lower())
        pos = sum(1 for w in words if w in POSITIVE_WORDS)
        neg = sum(1 for w in words if w in NEGATIVE_WORDS)
        if pos > neg:
            sentiment = "positive"
            score = min(1.0, 0.5 + pos * 0.15)
        elif neg > pos:
            sentiment = "negative"
            score = max(-1.0, -0.5 - neg * 0.15)
        else:
            sentiment = "neutral"
            score = 0.0
        timeline.append({"time": seg["start"], "sentiment": sentiment, "score": round(score, 2)})
    return timeline


def search_across_transcripts(query: str, all_transcripts: list) -> list:
    """
    Searches a keyword across multiple transcripts and returns matching
    videos with the matching lines.
    """
    query_lower = query.lower()
    results = []
    for doc in all_transcripts:
        matches = [seg for seg in doc.get("segments", []) if query_lower in seg["text"].lower()]
        if matches:
            results.append({
                "video_id": doc["video_id"],
                "video_title": doc.get("video_title", "Video"),
                "match_count": len(matches),
                "matches": matches[:3],  # top 3 matches per video
            })
    results.sort(key=lambda r: r["match_count"], reverse=True)
    return results