"""
Transcript Accuracy & Quality Validation Service.

Produces a quantitative report for AI-generated transcripts so educators can
trust (or quickly correct) Whisper output.  Metrics include:

  * Word / sentence counts and speaking speed (words per minute vs duration)
  * Duration coverage (how much of the video is covered by segments)
  * Average / minimum segment confidence (when Whisper supplies it)
  * Filler-word ratio, empty segment ratio and uppercase ratio (common
    transcription-artefact heuristics)

The result is a normalized ``quality_score`` (0-100) with a human readable
``rating`` plus a set of boolean ``flags`` that highlight specific problems.
"""

import re
import statistics
from typing import Optional

# Common disfluencies Whisper tends to leave in raw output.  ``uh`` / ``um``
# are the most frequent; the list is deliberately short to avoid false
# positives on legitimate vocabulary.
FILLER_WORDS = {
    "uh", "um", "uhh", "umm", "er", "erm",
    "like", "you know", "i mean", "kind of", "sort of",
}

# Speaking speed thresholds (words per minute).  120-170 wpm is the normal
# conversational range for lectures; beyond this the transcript is likely
# mis-aligned or the audio was duplicated.
SLOW_WPM = 100.0
IDEAL_WPM_MIN = 120.0
IDEAL_WPM_MAX = 170.0
FAST_WPM = 220.0
# Confidence (0-100) below which a transcript should be reviewed manually.
LOW_CONFIDENCE = 50.0

# Ratio of uppercase letters above which the text is probably a boilerplate
# / metadata dump instead of a real transcript.
HIGH_UPPERCASE_RATIO = 0.40


class TranscriptValidationService:
    """Validate the accuracy / quality of an AI-generated transcript."""

    @classmethod
    def validate(
        cls,
        transcript,
        video_duration: Optional[float] = None,
    ) -> dict:
        """
        Produce a transcript accuracy & quality report.

        Args:
            transcript: A ``Transcript`` model instance (or a dict-like object)
                exposing ``transcript``, ``language``, ``confidence`` and
                ``segments``.
            video_duration: The source video duration in seconds (optional).
                Used for speaking-speed and duration-coverage metrics.

        Returns:
            dict: A report with ``valid``, ``quality_score``, ``rating``,
            ``metrics`` and ``flags`` keys.
        """
        text = getattr(transcript, "transcript", None) or ""
        text = text.strip()

        segments = getattr(transcript, "segments", None) or []
        stored_confidence = getattr(transcript, "confidence", None)

        metrics = cls._compute_metrics(
            text=text,
            segments=segments,
            stored_confidence=stored_confidence,
            video_duration=video_duration,
        )

        flags = cls._compute_flags(metrics)

        score, rating = cls._overall(metrics, flags)

        return {
            "valid": bool(text) and not flags["is_empty"],
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
        text: str,
        segments: list,
        stored_confidence: Optional[int],
        video_duration: Optional[float],
    ) -> dict:
        words = re.findall(r"\b\w+\b", text.lower())

        sentences = [
            s for s in re.split(r"[.!?]+", text) if s.strip()
        ]

        # Confidence -------------------------------------------------
        segment_confidences = [
            float(seg.get("confidence"))
            for seg in segments
            if isinstance(seg, dict)
            and seg.get("confidence") is not None
        ]

        if segment_confidences:
            average_confidence = round(
                statistics.mean(segment_confidences), 2
            )
            min_confidence = round(min(segment_confidences), 2)
            segments_with_confidence = len(segment_confidences)
        else:
            average_confidence = (
                float(stored_confidence)
                if stored_confidence is not None
                else None
            )
            min_confidence = average_confidence
            segments_with_confidence = 0

        # Duration coverage ------------------------------------------
        end_times = [
            float(seg.get("end", 0.0))
            for seg in segments
            if isinstance(seg, dict) and seg.get("end") is not None
        ]
        last_end = max(end_times) if end_times else None

        duration_coverage = None
        if last_end is not None and video_duration:
            duration_coverage = round(
                min(last_end / video_duration, 1.0) * 100, 2
            )

        # Speaking speed ---------------------------------------------
        speaking_speed = None
        if video_duration and video_duration > 0:
            minutes = video_duration / 60.0
            speaking_speed = round(len(words) / minutes, 1)

        # Filler words -----------------------------------------------
        filler_count = 0
        for filler in FILLER_WORDS:
            if " " in filler:
                filler_count += len(re.findall(
                    re.escape(filler), text.lower()
                ))
            else:
                filler_count += len(re.findall(
                    rf"\b{re.escape(filler)}\b", text.lower()
                ))

        filler_ratio = (
            round(filler_count / len(words), 4)
            if words else 0.0
        )

        # Segment structure ------------------------------------------
        empty_segments = [
            seg for seg in segments
            if not (seg.get("text") or "").strip()
        ]

        empty_segment_ratio = (
            round(len(empty_segments) / len(segments), 4)
            if segments else 0.0
        )

        # Uppercase ratio (hallucination / boilerplate heuristic) ----
        letters = [c for c in text if c.isalpha()]
        uppercase_letters = [c for c in letters if c.isupper()]
        uppercase_ratio = (
            round(len(uppercase_letters) / len(letters), 4)
            if letters else 0.0
        )

        return {
            "word_count": len(words),
            "sentence_count": len(sentences),
            "average_confidence": average_confidence,
            "min_confidence": min_confidence,
            "segments_with_confidence": segments_with_confidence,
            "total_segments": len(segments),
            "speaking_speed": speaking_speed,
            "duration_coverage": duration_coverage,
            "filler_word_count": filler_count,
            "filler_word_ratio": filler_ratio,
            "empty_segment_count": len(empty_segments),
            "empty_segment_ratio": empty_segment_ratio,
            "uppercase_ratio": uppercase_ratio,
        }
    # ------------------------------------------------------------------
    # Flags
    # ------------------------------------------------------------------

    @classmethod
    def _compute_flags(cls, metrics: dict) -> dict:
        text_present = metrics["word_count"] > 0

        too_short = text_present and metrics["word_count"] < 20

        very_fast = (
            metrics["speaking_speed"] is not None
            and metrics["speaking_speed"] > FAST_WPM
        )

        low_confidence = (
            metrics["average_confidence"] is not None
            and metrics["average_confidence"] < LOW_CONFIDENCE
        )

        high_filler_ratio = (
            metrics["word_count"] > 0
            and metrics["filler_word_ratio"] > 0.08
        )

        poor_coverage = (
            metrics["duration_coverage"] is not None
            and metrics["duration_coverage"] < 60.0
        )

        high_uppercase = metrics["uppercase_ratio"] > HIGH_UPPERCASE_RATIO

        return {
            "is_empty": not text_present,
            "too_short": too_short,
            "very_fast": very_fast,
            "low_confidence": low_confidence,
            "high_filler_ratio": high_filler_ratio,
            "poor_coverage": poor_coverage,
            "high_uppercase": high_uppercase,
        }

    # ------------------------------------------------------------------
    # Overall score
    # ------------------------------------------------------------------

    @classmethod
    def _overall(cls, metrics: dict, flags: dict) -> tuple:
        """Compute a 0-100 weighted quality score and rating."""
        if flags["is_empty"]:
            return 0, "No Transcript"

        # Confidence (0-100) — weight 0.35
        confidence = metrics["average_confidence"]
        confidence_score = confidence if confidence is not None else 50.0
        confidence_score = max(0.0, min(confidence_score, 100.0))

        # Duration coverage (%) — weight 0.25
        coverage = metrics["duration_coverage"]
        coverage_score = coverage if coverage is not None else 70.0
        coverage_score = max(0.0, min(coverage_score, 100.0))

        # Speaking speed — weight 0.20.  Penalise when outside the ideal band.
        speed = metrics["speaking_speed"]
        if speed is None:
            speed_score = 70.0
        elif IDEAL_WPM_MIN <= speed <= IDEAL_WPM_MAX:
            speed_score = 100.0
        elif speed < SLOW_WPM:
            speed_score = 50.0
        elif speed > FAST_WPM:
            speed_score = 30.0
        else:
            # Linear fall-off outside the ideal band.
            speed_score = max(
                30.0,
                100.0 - (abs(speed - IDEAL_WPM_MIN) * 1.5),
            )

        # Structure (empty segments + uppercase ratio) — weight 0.12
        structure_score = 100.0
        if metrics["empty_segment_ratio"] > 0.05:
            structure_score -= 30.0
        if metrics["uppercase_ratio"] > HIGH_UPPERCASE_RATIO:
            structure_score -= 40.0
        structure_score = max(0.0, structure_score)

        # Filler ratio — weight 0.08
        filler_ratio = metrics["filler_word_ratio"]
        filler_score = max(
            0.0,
            100.0 - (filler_ratio * 500.0),
        )

        score = (
            confidence_score * 0.35
            + coverage_score * 0.25
            + speed_score * 0.20
            + structure_score * 0.12
            + filler_score * 0.08
        )

        score = min(int(round(score)), 100)

        if score >= 90:
            rating = "Excellent"
        elif score >= 75:
            rating = "Good"
        elif score >= 60:
            rating = "Fair"
        else:
            rating = "Needs Review"

        return score, rating

        