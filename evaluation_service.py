"""
Summary Evaluation Service

Computes evaluation metrics for AI-generated summaries.
"""
import re
from collections import Counter

try:
    from rouge_score import rouge_scorer
    ROUGE_AVAILABLE = True
except ImportError:
    ROUGE_AVAILABLE = False


class EvaluationService:
    """Evaluate generated summaries."""

    def __init__(self):
        if ROUGE_AVAILABLE:
            self.scorer = rouge_scorer.RougeScorer(
                ["rouge1", "rouge2", "rougeL"],
                use_stemmer=True,
            )

    # ---------------------------------------------------------
    # Helpers
    # ---------------------------------------------------------

    def clean_text(self, text: str) -> str:
        if not text:
            return ""

        text = text.replace("\n", " ")
        text = re.sub(r"\s+", " ", text)

        return text.strip()

    def word_count(self, text: str) -> int:
        return len(self.clean_text(text).split())

    def sentence_count(self, text: str) -> int:
        if not text:
            return 0

        sentences = re.split(r"[.!?]+", text)

        return len([s for s in sentences if s.strip()])

    # ---------------------------------------------------------
    # ROUGE
    # ---------------------------------------------------------

    def rouge_scores(self, transcript: str, summary: str):

        if not ROUGE_AVAILABLE:
            return {
                "rouge1": 0,
                "rouge2": 0,
                "rougeL": 0,
            }

        scores = self.scorer.score(transcript, summary)

        return {
            "rouge1": round(scores["rouge1"].fmeasure * 100, 2),
            "rouge2": round(scores["rouge2"].fmeasure * 100, 2),
            "rougeL": round(scores["rougeL"].fmeasure * 100, 2),
        }

    # ---------------------------------------------------------
    # Compression
    # ---------------------------------------------------------

    def compression_ratio(self, transcript: str, summary: str):

        transcript_words = self.word_count(transcript)
        summary_words = self.word_count(summary)

        if transcript_words == 0:
            ratio = 0
        else:
            ratio = (
                (1 - (summary_words / transcript_words))
                * 100
            )

        return {
            "transcript_words": transcript_words,
            "summary_words": summary_words,
            "compression_ratio": round(ratio, 2),
        }

    # ---------------------------------------------------------
    # Reading Time
    # ---------------------------------------------------------

    def reading_time(self, summary: str):

        words = self.word_count(summary)

        minutes = max(1, round(words / 200))

        return {
            "minutes": minutes,
            "label": f"{minutes} min"
        }

    # ---------------------------------------------------------
    # Sentence Reduction
    # ---------------------------------------------------------

    def sentence_reduction(self, transcript: str, summary: str):

        transcript_sentences = self.sentence_count(transcript)
        summary_sentences = self.sentence_count(summary)

        if transcript_sentences == 0:
            reduction = 0
        else:
            reduction = (
                (1 - (summary_sentences / transcript_sentences))
                * 100
            )

        return {
            "transcript_sentences": transcript_sentences,
            "summary_sentences": summary_sentences,
            "sentence_reduction": round(reduction, 2),
        }

    # ---------------------------------------------------------
    # Keyword Coverage
    # ---------------------------------------------------------

    def keyword_coverage(
        self,
        transcript: str,
        summary: str,
        top_n: int = 30,
    ):

        words = re.findall(
            r"\b[a-zA-Z]{4,}\b",
            transcript.lower(),
        )

        common = Counter(words).most_common(top_n)

        keywords = {word for word, _ in common}

        summary_words = set(
            re.findall(
                r"\b[a-zA-Z]{4,}\b",
                summary.lower(),
            )
        )

        matched = len(keywords & summary_words)

        coverage = (
            matched / len(keywords) * 100
            if keywords else 0
        )

        return {
            "total_keywords": len(keywords),
            "matched_keywords": matched,
            "keyword_coverage": round(coverage, 2),
        }

    # ---------------------------------------------------------
    # Content Coverage
    # ---------------------------------------------------------

    def content_coverage(self, rouge):

        return round(
            (
                rouge["rouge1"] +
                rouge["rouge2"] +
                rouge["rougeL"]
            ) / 3,
            2,
        )

    # ---------------------------------------------------------
    # Overall Score
    # ---------------------------------------------------------

    def overall_score(
        self,
        rouge,
        keyword,
        compression,
    ):

        score = (
            rouge["rouge1"] * 0.20 +
            rouge["rouge2"] * 0.15 +
            rouge["rougeL"] * 0.20 +
            keyword["keyword_coverage"] * 0.25 +
            compression["compression_ratio"] * 0.20
        )

        score = min(round(score), 100)

        if score >= 90:
            rating = "Excellent"
        elif score >= 75:
            rating = "Good"
        elif score >= 60:
            rating = "Fair"
        else:
            rating = "Needs Improvement"

        return {
            "score": score,
            "rating": rating,
        }

    # ---------------------------------------------------------
    # Main Evaluation
    # ---------------------------------------------------------

    def evaluate(
        self,
        transcript: str,
        summary: str,
    ):

        transcript = self.clean_text(transcript)
        summary = self.clean_text(summary)

        rouge = self.rouge_scores(
            transcript,
            summary,
        )

        compression = self.compression_ratio(
            transcript,
            summary,
        )

        keyword = self.keyword_coverage(
            transcript,
            summary,
        )

        reading = self.reading_time(summary)

        sentences = self.sentence_reduction(
            transcript,
            summary,
        )

        overall = self.overall_score(
            rouge,
            keyword,
            compression,
        )

        return {
            "overall_score": overall,
            "rouge": rouge,
            "compression": compression,
            "keyword": keyword,
            "reading_time": reading,
            "sentence": sentences,
            "content_coverage":
                self.content_coverage(rouge),
        }