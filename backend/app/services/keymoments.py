"""
Extractive key-moment detection service.
Scores transcript segments by keyword importance (word frequency,
excluding common stopwords) and picks the most representative,
well-spread segments as "key moments".
"""

import re

STOPWORDS = set("""
a an the is are was were be been being have has had do does did will would shall should
may might must can could of in on at by for with about against between into through
during before after above below to from up down out off over under again further then
once here there when where why how all any both each few more most other some such no
nor not only own same so than too very s t just don now i you he she it we they me him
her us them my your his its our their this that these those and or but if because as
what which who whom while am
""".split())


def score_segments(segments: list[dict]) -> list[dict]:
    word_freq = {}
    for seg in segments:
        for w in re.findall(r"[a-zA-Z']+", seg["text"].lower()):
            if w not in STOPWORDS and len(w) > 2:
                word_freq[w] = word_freq.get(w, 0) + 1

    scored = []
    for seg in segments:
        words = [w for w in re.findall(r"[a-zA-Z']+", seg["text"].lower()) if w not in STOPWORDS and len(w) > 2]
        if not words:
            continue
        score = sum(word_freq.get(w, 0) for w in words) / (len(words) ** 0.5)
        scored.append({**seg, "score": score})

    return scored


def make_label(text: str, max_words: int = 8) -> str:
    words = text.strip().split()
    label = " ".join(words[:max_words])
    if len(words) > max_words:
        label += "..."
    return label[0].upper() + label[1:] if label else "Key Moment"


def generate_key_moments(segments: list[dict], num_moments: int = 6) -> list[dict]:
    if not segments:
        return []

    scored = score_segments(segments)
    if not scored:
        return []

    scored.sort(key=lambda s: s["score"], reverse=True)

    total_duration = max(s["end"] for s in segments)
    min_gap = max(total_duration / (num_moments * 2), 5)  # keep moments spread out

    selected = []
    for seg in scored:
        if all(abs(seg["start"] - s["start"]) >= min_gap for s in selected):
            selected.append(seg)
        if len(selected) >= num_moments:
            break

    selected.sort(key=lambda s: s["start"])

    return [
        {"time": round(s["start"], 2), "label": make_label(s["text"])}
        for s in selected
    ]