"""
Keyword Extraction Service.
Extracts the most frequent meaningful words from a transcript
using NLTK stopwords and frequency counting.
"""
import re
import logging
from collections import Counter

from nltk.corpus import stopwords

logger = logging.getLogger(__name__)


class KeywordService:
    """
    Extract exact keywords from transcript text.
    Returns words exactly as they appear (lowercased for counting
    but preserving the original form from the transcript).
    """

    def __init__(self):
        self.stop_words = set(stopwords.words("english"))

    def extract_keywords(self, transcript: str, top_n: int = 20) -> list[dict]:
        """
        Extract exact keywords from transcript.

        Args:
            transcript: Raw transcript text.
            top_n: Number of top keywords to return (default 20).

        Returns:
            List of dicts with keys: keyword, count.
        """
        if not transcript or not transcript.strip():
            return []

        # Remove punctuation
        text = re.sub(r"[^\w\s]", "", transcript)

        # Split into words
        words = text.split()

        keywords = []

        for word in words:
            w = word.lower()

            if (
                len(w) < 3
                or w.isdigit()
                or w in self.stop_words
            ):
                continue

            keywords.append(w)

        counts = Counter(keywords)

        return [
            {
                "keyword": word,
                "count": count,
            }
            for word, count in counts.most_common(top_n)
        ]