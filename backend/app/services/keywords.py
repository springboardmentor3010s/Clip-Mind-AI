"""
Extracts top keywords/topics from transcript text using simple
frequency-based NLP (no extra model download needed).
"""

import re
from collections import Counter

STOPWORDS = set("""
a an the is are was were be been being have has had do does did will would shall should
may might must can could of in on at by for with about against between into through
during before after above below to from up down out off over under again further then
once here there when where why how all all any both each few more most other some such
no nor not only own same so than too very s t just don now i you he she it we they me
him her us them my your his its our their this that these those and or but if because
as what which who whom while am um uh like know mean actually basically literally right
well going get got going gonna wanna kind sort yeah okay ok
""".split())


def extract_keywords(text: str, top_n: int = 8) -> list[dict]:
    words = re.findall(r"[a-zA-Z][a-zA-Z']+", text.lower())
    filtered = [w for w in words if w not in STOPWORDS and len(w) > 3]

    counts = Counter(filtered)
    top = counts.most_common(top_n)

    max_count = top[0][1] if top else 1
    return [
        {"word": word.capitalize(), "count": count, "weight": round(count / max_count, 2)}
        for word, count in top
    ]