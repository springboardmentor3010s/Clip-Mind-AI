"""
YouTube-style chapter generation service.

Pipeline:
  1. Compute embeddings for each Whisper segment using sentence-transformers.
  2. Detect topic shifts by comparing consecutive segment embeddings (cosine similarity).
  3. Group consecutive segments with similar topic into chapter candidates.
  4. Merge very short chapters into adjacent ones.
  5. For each merged chapter, generate a concise title + description via BART.
  6. Assign importance based on duration, coherence, and keyword density.

This replaces the per-segment KeyBERT approach with a semantic chapter detector
that produces output similar to YouTube automatic chapters.
"""
import json
import logging
import re
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from keybert import KeyBERT
from sklearn.metrics.pairwise import cosine_similarity

from app.services.summary_service import SummaryService

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Chapter schema (internal, used before DB save)
# ---------------------------------------------------------------------------

class Chapter:
    """Represents a single YouTube-style chapter."""

    __slots__ = (
        "id", "start_time", "end_time", "title",
        "description", "importance", "score",
    )

    def __init__(
        self,
        id: int,
        start_time: float,
        end_time: float,
        title: str,
        description: str,
        importance: str = "Medium",
        score: float = 0.5,
    ):
        self.id = id
        self.start_time = start_time
        self.end_time = end_time
        self.title = title
        self.description = description
        self.importance = importance
        self.score = score

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "title": self.title,
            "description": self.description,
            "importance": self.importance,
            "score": self.score,
        }


# ---------------------------------------------------------------------------
# Main service
# ---------------------------------------------------------------------------

class ChapterGenerationService:
    """
    Detects topic boundaries in Whisper segments and generates
    YouTube-style chapters with titles, descriptions, and importance scores.
    """

    # Thresholds for topic-change detection
    SIMILARITY_THRESHOLD_HIGH = 0.82   # definitely same topic
    SIMILARITY_THRESHOLD_LOW = 0.55    # definitely different topic
    MIN_CHAPTER_WORDS = 15             # minimum word count per chapter
    MIN_CHAPTER_DURATION = 10.0        # minimum seconds per chapter
    MAX_CHAPTERS = 12                  # like YouTube
    MIN_CHAPTERS = 6

    def __init__(
        self,
        model_name: str = "all-MiniLM-L6-v2",
    ):
        logger.info(f"Loading embedding model for chapter detection: {model_name}")
        # Re-use KeyBERT's underlying sentence-transformer model for embeddings
        self.kw_model = KeyBERT(model_name)
        # The underlying sentence-transformer model
        self.embedding_model = self.kw_model.model.embedding_model
        self.summarizer = SummaryService()
        logger.info("ChapterGenerationService initialized")

    # ----------------------------------------------------------------
    # Embedding helpers
    # ----------------------------------------------------------------

    def _get_embeddings(self, texts: List[str]) -> np.ndarray:
        """Compute sentence embeddings for a list of texts."""
        if not texts:
            return np.array([])
        try:
            embeddings = self.embedding_model.encode(texts, show_progress_bar=False)
            return np.array(embeddings)
        except Exception as e:
            logger.warning(f"Embedding failed, falling back: {e}")
            return np.array([])

    # ----------------------------------------------------------------
    # Topic-change detection
    # ----------------------------------------------------------------

    def _detect_topic_boundaries(
        self,
        segments: List[Dict[str, Any]],
    ) -> List[int]:
        """
        Returns a list of segment indices that are chapter boundaries
        (i.e., indices where a new chapter starts).

        Uses cosine similarity between consecutive segment embeddings.
        """
        if not segments or len(segments) < 2:
            return [0]

        texts = [seg.get("text", "").strip() for seg in segments]
        embeddings = self._get_embeddings(texts)

        if embeddings.size == 0:
            # Fallback: uniform chapters
            return self._uniform_boundaries(len(segments))

        boundaries = [0]  # first segment always starts a chapter

        for i in range(1, len(segments)):
            sim = cosine_similarity(
                embeddings[i].reshape(1, -1),
                embeddings[i - 1].reshape(1, -1),
            )[0][0]

            # A topic change is detected when similarity drops below threshold
            if sim < self.SIMILARITY_THRESHOLD_LOW:
                boundaries.append(i)

        # Ensure the last boundary is included
        if boundaries[-1] != len(segments):
            boundaries.append(len(segments))

        logger.debug(
            f"Detected {len(boundaries) - 1} topic boundaries "
            f"from {len(segments)} segments"
        )
        return boundaries

    def _uniform_boundaries(self, n_segments: int) -> List[int]:
        """Fallback: segment into roughly equal parts."""
        target_chapters = min(self.MAX_CHAPTERS, max(self.MIN_CHAPTERS, n_segments // 3))
        chunk_size = max(1, n_segments // target_chapters)
        boundaries = list(range(0, n_segments, chunk_size))
        if boundaries[-1] != n_segments:
            boundaries.append(n_segments)
        return boundaries

    # ----------------------------------------------------------------
    # Chapter merging / refinement
    # ----------------------------------------------------------------

    def _merge_small_chapters(
        self,
        boundaries: List[int],
        segments: List[Dict[str, Any]],
    ) -> List[Tuple[int, int]]:
        """
        Merge chapters that are too short (by duration or word count)
        into adjacent chapters.

        Returns list of (start_idx, end_idx) tuples.
        """
        if len(boundaries) < 2:
            return [(0, len(segments))]

        chapters = []
        for i in range(len(boundaries) - 1):
            start_idx = boundaries[i]
            end_idx = boundaries[i + 1]
            chapter_segments = segments[start_idx:end_idx]

            total_duration = sum(
                seg.get("end", 0) - seg.get("start", 0)
                for seg in chapter_segments
            )
            total_words = sum(
                len(seg.get("text", "").split())
                for seg in chapter_segments
            )

            chapters.append({
                "start_idx": start_idx,
                "end_idx": end_idx,
                "duration": total_duration,
                "words": total_words,
            })

        # Merge small chapters into the previous one (or next if first)
        merged = []
        for ch in chapters:
            if not merged:
                merged.append(ch)
                continue

            if (
                ch["duration"] < self.MIN_CHAPTER_DURATION
                or ch["words"] < self.MIN_CHAPTER_WORDS
            ) and len(merged) > 0:
                # Merge into previous chapter
                merged[-1]["end_idx"] = ch["end_idx"]
                merged[-1]["duration"] += ch["duration"]
                merged[-1]["words"] += ch["words"]
            else:
                merged.append(ch)

        # If after merging we have too many chapters, merge the smallest ones
        while len(merged) > self.MAX_CHAPTERS:
            # Find the smallest chapter by duration
            smallest = min(merged, key=lambda x: x["duration"])
            idx = merged.index(smallest)
            if idx > 0:
                merged[idx - 1]["end_idx"] = smallest["end_idx"]
                merged[idx - 1]["duration"] += smallest["duration"]
                merged[idx - 1]["words"] += smallest["words"]
                merged.pop(idx)
            elif idx + 1 < len(merged):
                merged[idx + 1]["start_idx"] = smallest["start_idx"]
                merged[idx + 1]["duration"] += smallest["duration"]
                merged[idx + 1]["words"] += smallest["words"]
                merged.pop(idx)
            else:
                break  # Should not happen

        return [(ch["start_idx"], ch["end_idx"]) for ch in merged]

    # ----------------------------------------------------------------
    # Title + description generation
    # ----------------------------------------------------------------

    def _generate_chapter_title(self, chapter_text: str, idx: int) -> str:
        """
        Generate a short, descriptive title for a chapter using BART.
        Falls back to summary-based title if BART fails.
        """
        if not chapter_text.strip():
            return f"Chapter {idx + 1}"

        try:
            summary_text = self.summarizer.summarize_chunk(
                chapter_text,
                max_length=30,
                min_length=8,
            ).strip()

            if summary_text:
                # Take the first sentence or clause (up to 60 chars, max 6 words)
                title = summary_text.split(".")[0].strip()
                # Keep max 6 words
                words = title.split()
                if len(words) > 6:
                    title = " ".join(words[:6])
                # Remove trailing punctuation
                title = title.rstrip(",:;!?")
                if title:
                    return title[:80]

            # Fallback: extract first meaningful sentence from chapter text
            sentences = re.split(r'[.!?\n]+', chapter_text)
            for sent in sentences:
                sent = sent.strip()
                if len(sent.split()) >= 3:
                    words = sent.split()
                    if len(words) > 6:
                        return " ".join(words[:6]).rstrip(",:;!?")
                    return sent[:80]

        except Exception as e:
            logger.warning(f"Title generation failed for chapter {idx}: {e}")

        return f"Chapter {idx + 1}"

    def _generate_chapter_description(self, chapter_text: str) -> str:
        """
        Generate a 1-2 sentence description for a chapter.
        """
        if not chapter_text.strip():
            return ""

        try:
            desc = self.summarizer.summarize_chunk(
                chapter_text,
                max_length=50,
                min_length=15,
            ).strip()
            if desc:
                # Ensure it's 1-2 sentences
                sentences = re.split(r'(?<=[.!?])\s+', desc)
                if len(sentences) > 2:
                    desc = " ".join(sentences[:2])
                return desc
        except Exception as e:
            logger.warning(f"Description generation failed: {e}")

        # Fallback: first 2 sentences of the chapter text
        sentences = re.split(r'(?<=[.!?])\s+', chapter_text)
        return " ".join(sentences[:2]).strip()[:200]

    def _compute_importance(
        self,
        duration: float,
        word_count: int,
        coherence_score: float,
    ) -> Tuple[str, float]:
        """
        Compute importance label and numeric score.

        Returns (label, score) where score is 0-1.
        """
        # Normalize factors
        duration_score = min(duration / 120.0, 1.0)  # 2 min = max
        word_score = min(word_count / 200.0, 1.0)    # 200 words = max
        coherence = coherence_score if coherence_score > 0 else 0.5

        combined = (
            duration_score * 0.35
            + word_score * 0.25
            + coherence * 0.40
        )

        if combined >= 0.80:
            return "Very High", combined
        elif combined >= 0.60:
            return "High", combined
        elif combined >= 0.40:
            return "Medium", combined
        else:
            return "Low", combined

    # ----------------------------------------------------------------
    # Main pipeline
    # ----------------------------------------------------------------

    def generate_chapters(
        self,
        transcript: str,
        segments: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Main entry point: generate YouTube-style chapters from Whisper segments.

        Args:
            transcript: Full transcript text (unused directly but available).
            segments: List of Whisper segments with {id, start, end, text}.

        Returns:
            dict: {
                "chapters": [...],
                "total_detected": int
            }
        """
        if not transcript.strip() or not segments:
            return {"chapters": [], "total_detected": 0}

        logger.info(
            f"Generating chapters from {len(segments)} segments "
            f"({len(transcript.split())} words)"
        )

        # Step 1: Detect topic boundaries
        boundaries = self._detect_topic_boundaries(segments)

        # Step 2: Merge small chapters
        chapter_ranges = self._merge_small_chapters(boundaries, segments)

        logger.info(f"Created {len(chapter_ranges)} chapter candidates")

        # Step 3: Generate chapter metadata
        chapters: List[Chapter] = []

        for idx, (start_idx, end_idx) in enumerate(chapter_ranges):
            chapter_segments = segments[start_idx:end_idx]

            # Compute timing
            start_time = chapter_segments[0].get("start", 0.0)
            end_time = chapter_segments[-1].get("end", 0.0)

            # Collect text
            chapter_text = " ".join(
                seg.get("text", "").strip()
                for seg in chapter_segments
            ).strip()

            word_count = len(chapter_text.split())
            duration = end_time - start_time

            # Compute internal coherence (average similarity within chapter)
            coherence = self._compute_chapter_coherence(chapter_segments)

            # Generate title and description
            title = self._generate_chapter_title(chapter_text, idx)
            description = self._generate_chapter_description(chapter_text)

            # Enforce title rules
            title = self._sanitize_title(title, idx)

            # Compute importance
            importance_label, score = self._compute_importance(
                duration=duration,
                word_count=word_count,
                coherence_score=coherence,
            )

            chapter = Chapter(
                id=idx + 1,
                start_time=start_time,
                end_time=end_time,
                title=title,
                description=description,
                importance=importance_label,
                score=score,
            )
            chapters.append(chapter)

        # Step 4: Ensure we have a reasonable number of chapters
        if len(chapters) < self.MIN_CHAPTERS and len(chapters) > 0:
            logger.info(
                f"Only {len(chapters)} chapters; redistributing to {self.MIN_CHAPTERS}"
            )
            chapters = self._redistribute_chapters(segments, chapters)

        logger.info(
            f"Generated {len(chapters)} YouTube-style chapters"
        )

        return {
            "chapters": [ch.to_dict() for ch in chapters],
            "total_detected": len(chapters),
        }

    # ----------------------------------------------------------------
    # Helpers
    # ----------------------------------------------------------------

    def _compute_chapter_coherence(
        self,
        chapter_segments: List[Dict[str, Any]],
    ) -> float:
        """Compute average pairwise similarity for segments in a chapter."""
        if len(chapter_segments) < 2:
            return 0.7  # Single segment chapters are inherently coherent

        texts = [seg.get("text", "").strip() for seg in chapter_segments]
        texts = [t for t in texts if t]

        if len(texts) < 2:
            return 0.7

        embeddings = self._get_embeddings(texts)
        if embeddings.size == 0 or len(embeddings) < 2:
            return 0.5

        # Average pairwise cosine similarity
        sim_matrix = cosine_similarity(embeddings)
        # Exclude self-similarity (diagonal)
        n = len(embeddings)
        total_sim = 0.0
        count = 0
        for i in range(n):
            for j in range(i + 1, n):
                total_sim += sim_matrix[i][j]
                count += 1

        return total_sim / count if count > 0 else 0.5

    def _sanitize_title(self, title: str, idx: int) -> str:
        """
        Ensure the title meets YouTube-chapter rules:
        - Max 6 words
        - Never empty
        - Never generic "Part X"
        - Describes what happens
        """
        title = title.strip()

        # Never empty
        if not title:
            title = f"Key Discussion"

        # Remove generic "Part X" patterns
        title = re.sub(r'\bPart\s+\d+\b', '', title, flags=re.IGNORECASE).strip()
        title = re.sub(r'\bChapter\s+\d+\b', '', title, flags=re.IGNORECASE).strip()

        # Remove leading punctuation/numbers like "1. ", "1:", etc.
        title = re.sub(r'^\d+[\.\:\)]\s*', '', title).strip()

        # If title became empty after sanitization
        if not title:
            title = f"Key Section {idx + 1}"

        # Max 6 words
        words = title.split()
        if len(words) > 6:
            title = " ".join(words[:6])

        # Remove trailing punctuation
        title = title.rstrip(",:;!?.")

        return title if title else f"Key Section {idx + 1}"

    def _redistribute_chapters(
        self,
        segments: List[Dict[str, Any]],
        current_chapters: List[Chapter],
    ) -> List[Chapter]:
        """
        If too few chapters were detected, redistribute segments evenly
        into MIN_CHAPTERS chapters.
        """
        if not segments:
            return current_chapters

        n = len(segments)
        target = self.MIN_CHAPTERS
        chunk_size = max(1, n // target)

        new_chapters = []
        for i in range(target):
            start_idx = i * chunk_size
            end_idx = min((i + 1) * chunk_size, n)
            if start_idx >= n:
                break

            chap_segs = segments[start_idx:end_idx]
            start_time = chap_segs[0].get("start", 0.0)
            end_time = chap_segs[-1].get("end", 0.0)
            chap_text = " ".join(s.get("text", "") for s in chap_segs).strip()

            title = self._generate_chapter_title(chap_text, i)
            title = self._sanitize_title(title, i)
            desc = self._generate_chapter_description(chap_text)
            importance, score = self._compute_importance(
                duration=end_time - start_time,
                word_count=len(chap_text.split()),
                coherence_score=0.5,
            )

            new_chapters.append(Chapter(
                id=i + 1,
                start_time=start_time,
                end_time=end_time,
                title=title,
                description=desc,
                importance=importance,
                score=score,
            ))

        return new_chapters if new_chapters else current_chapters


# ---------------------------------------------------------------------------
# Convenience factory
# ---------------------------------------------------------------------------

def generate_youtube_chapters(
    transcript: str,
    segments: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Convenience function: create a ChapterGenerationService and generate chapters.
    """
    service = ChapterGenerationService()
    return service.generate_chapters(transcript=transcript, segments=segments)
