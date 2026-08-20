"""
Bullet-point extraction helpers (pure Python — no model inference).

Used to derive concise key points from a generated summary. Kept in its own
module so it can be imported cheaply (e.g. for backfill scripts) without
loading the heavy transformers/torch stack.
"""
import re

# Small English stopword set used to weight important words higher.
_BULLET_STOPWORDS = frozenset(
    """
    a an and are as at be been but by for from had has have he her his i if in
    is it its of on or that the their them there they this to was we were what
    when which who will with you your about after all also any because before
    can could do does each even get got how into just like made make may more
    most much not now than then these those through too up very so some such
    """.split()
)

_WORD_REGEX = re.compile(r"[a-zA-Z0-9']+")


def _trim_bullet(sentence: str, max_chars: int = 140) -> str:
    """Shorten an overly long sentence to a concise-ish bullet."""
    if len(sentence) <= max_chars:
        return sentence

    cut = sentence[:max_chars]
    last_break = max(
        cut.rfind(","), cut.rfind(";"), cut.rfind(":"), cut.rfind("—")
    )
    if last_break > max_chars * 0.5:
        return cut[:last_break].rstrip(" ,;:—") + "."
    return cut.rstrip() + "..."


def generate_bullet_points(
    text: str,
    num_points: int = 8,
    max_chars: int = 140,
) -> list:
    """
    Extract concise key bullet points from a summary (extractive approach).

    Strategy:
      1. Split the text into sentences.
      2. Score each sentence by the summed frequency of its (non-stopword)
         words, with a small boost for the leading sentence.
      3. Keep the top ``num_points`` sentences, restored to original order.

    This is intentionally pure Python — it produces deterministic, fast
    highlights without running extra BART inference, so it can also be called
    on-demand for summaries generated before this feature existed.
    """
    if not text:
        return []

    text = re.sub(r"\s+", " ", text).strip()

    sentences = re.split(r"(?<=[.!?])\s+", text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 5]
    if not sentences:
        return []

    # Word-frequency table across the whole text (stop words excluded).
    freq: dict = {}
    for word in _WORD_REGEX.findall(text.lower()):
        if word in _BULLET_STOPWORDS:
            continue
        freq[word] = freq.get(word, 0) + 1

    # Score sentences.
    scored = []
    for index, sentence in enumerate(sentences):
        words = _WORD_REGEX.findall(sentence.lower())
        score = sum(freq.get(word, 0) for word in set(words))
        if index == 0:
            score *= 1.2  # lead-sentence bonus
        scored.append((score, index, sentence))

    scored.sort(key=lambda item: (-item[0], item[1]))
    selected = sorted(scored[:num_points], key=lambda item: item[1])

    bullets = []
    seen = set()
    for _, _, sentence in selected:
        trimmed = _trim_bullet(sentence, max_chars)
        key = trimmed.lower()
        if key in seen:
            continue
        seen.add(key)
        bullets.append(trimmed)

    return bullets