"""
AI Insight Service: generates meaningful intelligence from video content.

This service analyzes the transcript, summary, and key moments to produce
AI-powered insights including speaking speed, top keywords, confidence scores,
compression ratios, video quality metrics, and more.
"""
import re
from collections import Counter


STOP_WORDS = {
    "the", "is", "am", "are", "was", "were",
    "a", "an", "and", "or", "to", "of",
    "in", "on", "for", "with", "this",
    "that", "from", "into", "as", "by",
    "it", "be", "at", "you", "your"
}


class AIInsightService:
    """Service for generating AI-powered insights from video content."""

    @staticmethod
    def generate(video, transcript, summary, key_moments):
        """
        Generate comprehensive AI insights from video content.

        Args:
            video: Video model instance.
            transcript: Transcript model instance or None.
            summary: Summary model instance or None.
            key_moments: List of KeyMoment model instances.

        Returns:
            dict: Dictionary containing:
                - total_words: Total word count in transcript
                - speaking_speed: Words per minute
                - reading_time: Estimated reading time in minutes
                - compression_ratio: Percentage of transcript compressed/removed
                  (matches EvaluationService; higher = more compression)
                - confidence: Average AI confidence score
                - video_quality: Quality rating string
                - summary_quality: Summary quality rating string
                - processing_score: Combined AI processing score
                - transcript_density: Words per minute density
                - top_keywords: List of (keyword, count) tuples
        """
        transcript_text = transcript.transcript if transcript else ""
        summary_text = summary.detailed_summary if summary else ""

        words = re.findall(r"\b\w+\b", transcript_text.lower())
        total_words = len(words)

        duration = max(video.duration or 0, 1)

        minutes = duration / 60

        speaking_speed = round(total_words / minutes, 2)

        filtered = [
            w for w in words
            if len(w) > 3 and w not in STOP_WORDS
        ]

        keyword_counter = Counter(filtered)

        top_keywords = keyword_counter.most_common(10)

        summary_words = len(summary_text.split())

        # Compression ratio — matches EvaluationService formula:
        # percentage of the transcript that was compressed/removed
        # (higher = more compression), not the percentage retained.
        compression_ratio = (
            round(
                (1 - (summary_words / total_words)) * 100,
                2
            )
            if total_words
            else 0
        )

        if key_moments:
            confidences = [
                k.confidence for k in key_moments
                if k.confidence is not None
            ]
            if confidences:
                confidence = round(
                    sum(confidences)
                    / len(confidences)
                    * 100,
                    2
                )
            else:
                confidence = 0
        else:
            confidence = 0

        reading_time = round(total_words / 200, 1)

        transcript_density = round(
            total_words / minutes,
            1
        )

        # With the EvaluationService formula, higher = more compression = better.
        if compression_ratio >= 80:
            summary_quality = "Excellent"
        elif compression_ratio >= 65:
            summary_quality = "Good"
        elif compression_ratio >= 50:
            summary_quality = "Average"
        else:
            summary_quality = "Needs Improvement"

        if confidence >= 20:
            video_quality = "Excellent"
        elif confidence >= 10:
            video_quality = "Very Good"
        elif confidence >= 5:
            video_quality = "Good"
        else:
            video_quality = "Average"

        # Use compression_ratio directly (higher compression = better score).
        processing_score = round(
            (
                confidence
                + compression_ratio
            ) / 2,
            2
        )

        return {
            "total_words": total_words,
            "speaking_speed": speaking_speed,
            "reading_time": reading_time,
            "compression_ratio": compression_ratio,
            "confidence": confidence,
            "video_quality": video_quality,
            "summary_quality": summary_quality,
            "processing_score": processing_score,
            "transcript_density": transcript_density,
            "top_keywords": top_keywords
        }