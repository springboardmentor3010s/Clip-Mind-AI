"""
Summary Accuracy & Quality Validation Service.

Produces a quantitative report for AI-generated summaries so educators can
trust (or quickly correct) BART output.  Metrics include word counts, sentence
count/reading time, compression ratio, ROUGE overlap (content coverage),
keyword coverage, bullet-point count and an uppercase-ratio heuristic.
The result is a normalized ``quality_score`` (0-100) with a human readable
``rating`` plus boolean ``flags`` that highlight specific problems.

Heavyweight metrics are delegated to the existing ``EvaluationService`` which
only requires ``rouge_score``, so this module is cheap to import and easy to
test without loading torch/GPT models.
"""

from typing import Optional
from app.services.evaluation_service import EvaluationService

# Minimum words a detailed summary should contain before it is flagged too short.
MIN_SUMMARY_WORDS = 20

# Compression band (percentage of the transcript removed).  Below the lower
# bound the summary is too long; above the upper bound it is probably thinning
# out key details.
MIN_COMPRESSION = 40.0
IDEAL_COMPRESSION = 80.0

# Average ROUGE F1 below which the summary is unlikely to cover the content.
LOW_CONTENT_COVERAGE = 30.0

# Keyword coverage percentage below which the summary misses key topics.
LOW_KEYWORD_COVERAGE = 30.0

# Uppercase letter ratio above which the text is probably a boilerplate dump.
HIGH_UPPERCASE_RATIO = 0.40


class SummaryValidationService:
    """Validate the accuracy / quality of an AI-generated summary."""

    # Shared lightweight evaluator (no model inference).
    evaluator = EvaluationService()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    @classmethod
    def validate(
        cls,
        summary,
        transcript_text: Optional[str] = None,
        video_duration: Optional[float] = None,
    ) -> dict:
        """
        Produce a summary accuracy & quality report.

        Args:
            summary: A ``Summary`` model instance exposing ``detailed_summary``,
                ``short_summary`` and ``bullet_points``.
            transcript_text: The source transcript text (optional).  Used for
                compression / ROUGE / keyword metrics.  When omitted these
                metrics degrade to neutral values.
            video_duration: The source video duration in seconds (optional,
                reserved for future WPM metrics).

        Returns:
            dict: A report with ``valid``, ``quality_score``, ``rating``,
            ``metrics`` and ``flags`` keys.
        """
        detailed = getattr(summary, "detailed_summary", None) or ""
        short = getattr(summary, "short_summary", None) or ""
        bullet_points = getattr(summary, "bullet_points", None) or []

        metrics = cls._compute_metrics(
            detailed=detailed,
            short=short,
            transcript=transcript_text or "",
            bullet_points=bullet_points,
        )

        flags = cls._compute_flags(metrics)

        score, rating = cls._overall(metrics, flags)

        return {
            "valid": bool(detailed.strip()) and not flags["is_empty"],
            "quality_score": score,
            "rating": rating,
            "metrics": metrics,
            "flags": flags,
        }

    # ------------------------------------------------------------------
    # Metrics
    # ------------------------------------------------------------------

    @classmethod
    def _compute_metrics(
        cls,
        detailed: str,
        short: str,
        transcript: str,
        bullet_points: list,
    ) -> dict:
        evaluator = cls.evaluator

        detailed = evaluator.clean_text(detailed)
        short = evaluator.clean_text(short)
        transcript = evaluator.clean_text(transcript)

        transcript_words = evaluator.word_count(transcript)
        summary_words = evaluator.word_count(detailed)

        sentence_count = evaluator.sentence_count(detailed)

        compression = evaluator.compression_ratio(transcript, detailed)
        compression_ratio = compression["compression_ratio"]

        if transcript_words > 0:
            rouge = evaluator.rouge_scores(transcript, detailed)
            keyword = evaluator.keyword_coverage(transcript, detailed)
        else:
            rouge = {"rouge1": 0.0, "rouge2": 0.0, "rougeL": 0.0}
            keyword = {
                "total_keywords": 0,
                "matched_keywords": 0,
                "keyword_coverage": 0.0,
            }

        content_coverage = evaluator.content_coverage(rouge)

        reading_time_minutes = round(summary_words / 200.0, 2)

        if isinstance(bullet_points, list):
            bullet_point_count = len(bullet_points)
        else:
            bullet_point_count = 0

        letters = [ch for ch in detailed if ch.isalpha()]
        uppercase = [ch for ch in letters if ch.isupper()]
        uppercase_ratio = (
            round(len(uppercase) / len(letters), 4) if letters else 0.0
        )

        return {
            "summary_words": summary_words,
            "short_summary_words": evaluator.word_count(short),
            "transcript_words": transcript_words,
            "sentence_count": sentence_count,
            "compression_ratio": compression_ratio,
            "rouge1": rouge["rouge1"],
            "rouge2": rouge["rouge2"],
            "rougeL": rouge["rougeL"],
            "content_coverage": round(content_coverage, 2),
            "keyword_coverage": round(keyword["keyword_coverage"], 2),
            "reading_time_minutes": reading_time_minutes,
            "bullet_point_count": bullet_point_count,
            "uppercase_ratio": uppercase_ratio,
        }
# ------------------------------------------------------------------
    # Flags
    # ------------------------------------------------------------------

    @classmethod
    def _compute_flags(cls, metrics: dict) -> dict:
        text_present = metrics["summary_words"] > 0
        compression = metrics["compression_ratio"]

        too_short = (
            text_present and metrics["summary_words"] < MIN_SUMMARY_WORDS
        )

        overlong = (
            text_present
            and metrics["transcript_words"] > 0
            and compression < MIN_COMPRESSION
        )

        poor_compression = (
            text_present
            and metrics["transcript_words"] > 0
            and compression < MIN_COMPRESSION
        )

        low_content_coverage = (
            metrics["transcript_words"] > 0
            and metrics["content_coverage"] < LOW_CONTENT_COVERAGE
        )

        low_keyword_coverage = (
            metrics["transcript_words"] > 0
            and metrics["keyword_coverage"] < LOW_KEYWORD_COVERAGE
        )

        return {
            "is_empty": not text_present,
            "too_short": too_short,
            "overlong": overlong,
            "poor_compression": poor_compression,
            "low_content_coverage": low_content_coverage,
            "low_keyword_coverage": low_keyword_coverage,
            "no_bullet_points": metrics["bullet_point_count"] == 0,
            "high_uppercase": (
                metrics["uppercase_ratio"] > HIGH_UPPERCASE_RATIO
            ),
        }

    # ------------------------------------------------------------------
    # Overall score
    # ------------------------------------------------------------------

    @classmethod
    def _overall(cls, metrics: dict, flags: dict) -> tuple:
        """Compute a 0-100 weighted quality score and rating."""
        if flags["is_empty"]:
            return 0, "No Summary"

        compression = metrics["compression_ratio"]
        has_transcript = metrics["transcript_words"] > 0

        # Compression — weight 0.30.  Reward the ideal band; penalise summaries
        # that barely compress or that over-compress into nothingness.
        if not has_transcript:
            compression_score = 70.0
        elif MIN_COMPRESSION <= compression <= IDEAL_COMPRESSION:
            compression_score = 100.0
        elif compression > IDEAL_COMPRESSION:
            compression_score = max(
                40.0, 100.0 - (compression - IDEAL_COMPRESSION) * 1.5
            )
        else:
            compression_score = max(0.0, (compression / MIN_COMPRESSION) * 100.0)

        # Content coverage (average ROUGE F1) — weight 0.30.
        if not has_transcript:
            content_score = 70.0
        else:
            content_score = max(
                0.0, min(metrics["content_coverage"], 100.0)
            )

        # Keyword coverage — weight 0.20.
        if not has_transcript:
            keyword_score = 70.0
        else:
            keyword_score = max(
                0.0, min(metrics["keyword_coverage"], 100.0)
            )

        # Structure (reading time / length sanity) — weight 0.20.
        reading = metrics["reading_time_minutes"]
        if reading <= 0.1:
            reading_score = 30.0
        elif reading <= 1.0:
            reading_score = 60.0
        elif reading <= 5.0:
            reading_score = 100.0
        else:
            reading_score = max(40.0, 100.0 - (reading - 5.0) * 5.0)

        score = (
            compression_score * 0.30
            + content_score * 0.30
            + keyword_score * 0.20
            + reading_score * 0.20
        )

        score = min(int(round(score)), 100)

        if score >= 90:
            rating = "Excellent"
        elif score >= 75:
            rating = "Good"
        elif score >= 60:
            rating = "Fair"
        else:
            rating = "Needs Improvement"

        return score, rating