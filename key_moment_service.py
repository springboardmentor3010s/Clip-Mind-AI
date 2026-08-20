"""
Key moment detection service using Whisper segments + Summary + KeyBERT pipeline.

Pipeline per segment:
  1. Take each Whisper segment (with real timestamps)
  2. Summarize segment text using BART/T5 (via SummaryService)
  3. Extract keywords from the summary using KeyBERT
  4. Compute confidence score from combined keyword scores
  5. Generate meaningful title from summary/top keywords
"""
import logging
from typing import Dict, List, Any, Optional

from keybert import KeyBERT

from app.services.summary_service import SummaryService

logger = logging.getLogger(__name__)


class KeyMomentService:
    """
    Detect important transcript segments using Summary + KeyBERT.
    Mimics YouTube's "Key Moments" experience with proper timestamps.
    """

    def __init__(
        self,
        model_name: str = "all-MiniLM-L6-v2",
        min_confidence: float = 0.35,
    ):
        logger.info(f"Loading KeyBERT model: {model_name}")

        self.model = KeyBERT(model_name)
        self.min_confidence = min_confidence
        self.summarizer = SummaryService()

        logger.info("KeyMomentService initialized with SummaryService + KeyBERT")

    # ----------------------------------------------------------------
    # Keyword extraction
    # ----------------------------------------------------------------

    def extract_keywords(
        self,
        text: str,
        top_n: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        Extract keywords with confidence scores from a text.
        """
        if not text or not text.strip():
            return []

        try:
            keywords = self.model.extract_keywords(
                text,
                keyphrase_ngram_range=(1, 2),
                stop_words="english",
                top_n=top_n,
            )

            return [
                {
                    "keyword": keyword,
                    "score": float(score),
                }
                for keyword, score in keywords
            ]

        except Exception as e:
            logger.exception("Keyword extraction failed")
            raise RuntimeError(f"KeyBERT error: {e}")

    # ----------------------------------------------------------------
    # Main detection pipeline
    # ----------------------------------------------------------------

    def detect_key_moments(
        self,
        transcript: str,
        segments: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Detect important transcript segments using Whisper segments.

        Pipeline per segment:
          1. Summarize segment text with BART/T5
          2. Extract keywords from the summary
          3. Score segment based on keyword relevance
          4. Generate meaningful title

        Args:
            transcript: Full transcript text (for overall keyword context).
            segments: List of Whisper segments with {id, start, end, text}.

        Returns:
            dict: {
                "keywords": [...],       # Overall transcript keywords
                "key_moments": [...],     # Scored and ranked segments
                "total_detected": int
            }
        """
        if not transcript.strip() or not segments:
            return {
                "keywords": [],
                "key_moments": [],
                "total_detected": 0,
            }

        # Step 1: Extract overall keywords from full transcript for context
        overall_keywords = self.extract_keywords(transcript, top_n=15)
        logger.info(
            f"Extracted {len(overall_keywords)} overall keywords from transcript"
        )

        # Step 2: Process each Whisper segment
        key_moments = []

        for segment in segments:
            segment_text = segment.get("text", "").strip()
            segment_start = segment.get("start", 0.0)
            segment_end = segment.get("end", 0.0)

            if not segment_text:
                continue

            # Skip very short segments (likely noise)
            word_count = len(segment_text.split())
            if word_count < 5:
                continue

            # Step 2a: Summarize the segment
            segment_summary = self.summarizer.summarize_chunk(
                segment_text,
                max_length=50,
                min_length=10,
            )

            # Step 2b: Extract keywords from the segment summary
            # Use the summary text for keyword extraction (better signal)
            source_text = segment_summary if segment_summary else segment_text
            segment_keywords = self.extract_keywords(source_text, top_n=3)

            # Step 2c: Score the segment
            # Combined score from segment-specific keywords + overlap with overall keywords
            segment_score = 0.0
            matched_keywords = []

            # Score from segment's own keywords
            for kw in segment_keywords:
                segment_score += kw["score"]
                matched_keywords.append(kw["keyword"])

            # Bonus score: check if segment text contains overall transcript keywords
            segment_text_lower = segment_text.lower()
            for kw in overall_keywords:
                keyword = kw["keyword"].lower()
                if keyword in segment_text_lower and keyword not in matched_keywords:
                    segment_score += kw["score"] * 0.5  # Partial bonus

            # Normalize score to 0-1 range
            segment_score = min(round(segment_score / 2.0, 3), 1.0)

            # Step 2d: Generate meaningful title
            if segment_summary:
                # Use first sentence of summary as title (max 80 chars)
                title = (
                    segment_summary.split(".")[0]
                    if "." in segment_summary
                    else segment_summary
                )
                title = title.strip()[:80]
            else:
                # Fallback: use top 2 keywords
                title = (
                    ", ".join(matched_keywords[:2])
                    if matched_keywords
                    else "Key Moment"
                )

            if segment_score >= self.min_confidence:
                key_moments.append(
                    {
                        "start": segment_start,
                        "end": segment_end,
                        "text": segment_text,
                        "summary": segment_summary,
                        "title": title,
                        "score": segment_score,
                        "matched_keywords": matched_keywords[:5],
                    }
                )

        # Step 3: Sort by score (highest first) and limit to top moments
        key_moments.sort(key=lambda x: x["score"], reverse=True)
        key_moments = key_moments[:20]  # Max 20 key moments (like YouTube)

        # Sort back by start time for chronological order in display
        key_moments.sort(key=lambda x: x["start"])

        logger.info(
            f"Detected {len(key_moments)} key moments "
            f"(min_confidence={self.min_confidence})"
        )

        return {
            "keywords": overall_keywords,
            "key_moments": key_moments,
            "total_detected": len(key_moments),
        }

    # ----------------------------------------------------------------
    # Alternative: Direct Keyword Matching (fallback)
    # ----------------------------------------------------------------

    def detect_key_moments_fast(
        self,
        segments: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Faster variant: No summarization, just KeyBERT on each segment directly.
        Use this if summarization is too slow for your use case.
        """
        if not segments:
            return {
                "keywords": [],
                "key_moments": [],
                "total_detected": 0,
            }

        key_moments = []

        for segment in segments:
            segment_text = segment.get("text", "").strip()
            segment_start = segment.get("start", 0.0)
            segment_end = segment.get("end", 0.0)

            if not segment_text or len(segment_text.split()) < 5:
                continue

            segment_keywords = self.extract_keywords(segment_text, top_n=3)
            segment_score = sum(kw["score"] for kw in segment_keywords)
            segment_score = min(round(segment_score, 3), 1.0)
            matched_keywords = [kw["keyword"] for kw in segment_keywords]

            if segment_score >= self.min_confidence:
                title = (
                    ", ".join(matched_keywords[:2])
                    if matched_keywords
                    else "Key Moment"
                )
                key_moments.append(
                    {
                        "start": segment_start,
                        "end": segment_end,
                        "text": segment_text,
                        "summary": "",
                        "title": title,
                        "score": segment_score,
                        "matched_keywords": matched_keywords[:5],
                    }
                )

        key_moments.sort(key=lambda x: x["score"], reverse=True)
        key_moments = key_moments[:20]
        key_moments.sort(key=lambda x: x["start"])

        return {
            "keywords": [],
            "key_moments": key_moments,
            "total_detected": len(key_moments),
        }
