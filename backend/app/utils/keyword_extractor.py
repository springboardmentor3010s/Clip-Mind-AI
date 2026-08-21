from collections import Counter
import re

STOP_WORDS = {
    "the", "is", "a", "an", "and", "or", "to",
    "of", "in", "on", "for", "with", "that",
    "this", "it", "are", "was", "be", "as",
    "at", "by", "from", "we", "you", "i",
    "they", "he", "she", "them", "our", "your", "will",
    "can", "about", "which", "today", "not", "also", "more",
      "very", "many", "get", "use", "using", "used", "want", "see", "tell", "new"
}


def extract_keywords(transcript: str, top_n: int = 10):
    words = re.findall(r"\b[a-zA-Z]+\b", transcript.lower())

    filtered_words = [
        word for word in words
        if word not in STOP_WORDS and len(word) > 2
    ]

    word_counts = Counter(filtered_words)

    return [word for word, _ in word_counts.most_common(top_n)]