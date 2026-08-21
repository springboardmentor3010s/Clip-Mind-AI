"""
Real key-moment detection: score each transcript segment on a combination of
- TextRank salience (how central the segment's sentence is to the whole talk)
- keyword density (presence of frequently-used, non-stopword terms)
- position bonus (slight boost for openings/closings, which tend to carry
  framing and conclusions)
Then take the top-N segments, sorted back into chronological order.
"""
from services.nlp_service import textrank_sentences, extract_keywords, STOPWORDS, _tokenize_words

TAGS = ["Objective", "Method", "Result", "Discussion", "Q&A", "Conclusion"]


def build_moments(segments: list, top_n: int = 6):
    if not segments:
        return []

    texts = [s["text"] for s in segments]
    n = len(segments)
    top_n = min(top_n, n)

    # TextRank salience over the segment texts themselves.
    ranked_idx = textrank_sentences(texts, top_n=min(n, max(top_n * 2, top_n)))
    salience_rank = {idx: (len(ranked_idx) - rank) / len(ranked_idx) for rank, idx in enumerate(ranked_idx)}

    keyword_terms = {k["term"] for k in extract_keywords(" ".join(texts), top_n=20)}

    scored = []
    for i, seg in enumerate(segments):
        words = _tokenize_words(seg["text"])
        kw_hits = sum(1 for w in words if w in keyword_terms)
        kw_density = kw_hits / max(1, len(words))

        position_bonus = 0.1 if (i < n * 0.15 or i > n * 0.85) else 0.0
        salience = salience_rank.get(i, 0.0)

        score = 0.55 * salience + 0.35 * min(1.0, kw_density * 4) + position_bonus
        scored.append((i, score))

    scored.sort(key=lambda x: x[1], reverse=True)
    picks = sorted(scored[:top_n], key=lambda x: x[0])

    moments = []
    for rank, (i, score) in enumerate(picks):
        seg = segments[i]
        tag = TAGS[rank % len(TAGS)]
        headline = " ".join(seg["text"].split(" ")[:8])
        moments.append({
            "id": f"moment-{rank}",
            "seconds": seg["seconds"],
            "time": seg["time"],
            "title": f"{tag} — {headline}",
            "description": seg["text"],
            "confidence": round(min(0.98, max(0.5, 0.55 + score * 0.4)), 2),
            "tag": tag,
        })
    return moments
