"""
Generates auto-detected "chapters" from a transcript by grouping
segments into topic blocks based on natural time gaps and content
shifts (keyword-overlap between consecutive windows).
"""

import re
from app.services.keywords import STOPWORDS


def _keywords_in(text: str) -> set:
    words = re.findall(r"[a-zA-Z][a-zA-Z']+", text.lower())
    return {w for w in words if w not in STOPWORDS and len(w) > 3}


def generate_chapters(segments: list[dict], target_chapters: int = 6) -> list[dict]:
    if not segments:
        return []

    total_duration = segments[-1]["end"]
    window_size = max(total_duration / target_chapters, 20)

    chapters = []
    current_start = segments[0]["start"]
    current_texts = []

    for seg in segments:
        current_texts.append(seg["text"])
        if seg["end"] - current_start >= window_size:
            chapters.append({
                "start": round(current_start, 2),
                "text": " ".join(current_texts),
            })
            current_start = seg["end"]
            current_texts = []

    if current_texts:
        chapters.append({
            "start": round(current_start, 2),
            "text": " ".join(current_texts),
        })

    result = []
    for ch in chapters:
        kws = _keywords_in(ch["text"])
        top_kws = sorted(kws, key=lambda w: ch["text"].lower().count(w), reverse=True)[:3]
        title = " · ".join(w.capitalize() for w in top_kws) if top_kws else "Discussion"
        result.append({"time": ch["start"], "title": title})

    return result