IMPORTANT_KEYWORDS = [
    "important",
    "remember",
    "note",
    "key",
    "summary",
    "conclusion",
    "ai",
    "artificial intelligence",
    "machine learning",
    "deep learning",
    "future",
    "benefit",
    "advantage",
    "disadvantage",
    "result",
]


def detect_key_moments(segments):
    key_moments = []

    for segment in segments:
        text = segment["text"].lower()

        score = 0

        for keyword in IMPORTANT_KEYWORDS:
            if keyword in text:
                score += 1

        if score > 0:
            key_moments.append({
                "start": segment["start"],
                "end": segment["end"],
                "text": segment["text"],
                "score": score,
            })

    return key_moments