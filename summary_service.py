"""
BART Summary Service
Uses facebook/bart-large-cnn for stable, high-quality summarization.
"""

import logging
import re
import torch
from transformers import pipeline

from app.services.bullet_points import (
    generate_bullet_points,  # noqa: F401 — re-exported for convenience
)

logger = logging.getLogger(__name__)


class SummaryService:
    """
    BART Summarization Service
    Uses facebook/bart-large-cnn for stable, high-quality summarization.
    """

    def __init__(self):

        self.model_name = "facebook/bart-large-cnn"

        logger.info(f"Loading BART model: {self.model_name}")

        device = 0 if torch.cuda.is_available() else -1

        self.summarizer = pipeline(
            "summarization",
            model=self.model_name,
            tokenizer=self.model_name,
            device=device,
        )

        logger.info("BART model loaded successfully")

    # -----------------------------------------------------

    def clean_text(self, text: str) -> str:
        """
        Clean transcript before summarization.
        """

        text = re.sub(r"\s+", " ", text)
        text = text.replace("\n", " ")
        text = text.strip()

        return text

    # -----------------------------------------------------

    def chunk_text(self, text, chunk_size=700):

        words = text.split()

        chunks = []

        for i in range(0, len(words), chunk_size):
            chunk = " ".join(words[i:i + chunk_size])
            chunks.append(chunk)

        return chunks

    # -----------------------------------------------------

    def _compute_short_lengths(self, words: int):
        """
        Compute dynamic max/min lengths for a short summary
        based on the word count of the input text.

        Short summary → 2–4 sentences for quick preview.
        """
        short_max = min(80, max(40, words // 4))
        short_min = max(20, short_max // 2)
        return short_max, short_min

    # -----------------------------------------------------

    def _compute_detailed_lengths(self, words: int):
        """
        Compute dynamic max/min lengths for a detailed summary
        based on the word count of the input text.

        Detailed summary → richer, more informative output.
        """
        detail_max = min(250, max(100, words // 2))
        detail_min = max(50, detail_max // 2)
        return detail_max, detail_min

    # -----------------------------------------------------

    def summarize_chunk(self, text, max_length=150, min_length=40):
        """
        Summarize a single chunk of text with the given length constraints.

        Dynamically caps ``max_length`` based on the actual input token
        count to prevent the HuggingFace warning:

            "Your max_length is set to N, but your input_length is only M.
             Since this is a summarization task, where outputs shorter than
             the input are typically wanted, you might consider decreasing
             max_length manually …"
        """

        # Determine the input length in *tokens* (not words) so we can cap
        # max_length accordingly.  BART's tokenizer max input is 1024 tokens.
        input_tokens = len(
            self.summarizer.tokenizer.encode(
                text, truncation=True, max_length=1024
            )
        )

        # If the input is extremely short there is nothing meaningful to
        # summarise — return the text unchanged.
        if input_tokens <= 2:
            logger.debug(
                "summarize_chunk: input too short (%d tokens), returning as-is",
                input_tokens,
            )
            return text

        # Cap max_length to ~80 % of the input token count so the output is
        # always shorter than the input (the core goal of summarization).
        token_cap = max(15, int(input_tokens * 0.8))

        # Never let the cap exceed input_tokens - 1 (output must be shorter
        # than input).  This handles very short inputs where 80 % would
        # still be above the 15-token floor.
        token_cap = min(token_cap, max(1, input_tokens - 1))

        effective_max = min(max_length, token_cap)

        # Ensure min_length stays below max_length.
        effective_min = min(min_length, effective_max - 1)
        effective_min = max(1, effective_min)

        logger.debug(
            "summarize_chunk: input_tokens=%d, requested max=%d min=%d → "
            "effective max=%d min=%d",
            input_tokens, max_length, min_length,
            effective_max, effective_min,
        )

        result = self.summarizer(
            text,
            max_length=effective_max,
            min_length=effective_min,
            do_sample=False,
            truncation=True,
        )

        return result[0]["summary_text"]

    # -----------------------------------------------------

    def summarize(self, transcript: str):
        """
        Generate both a short and a detailed summary from the transcript.

        • Short summary  – concise 2–4 sentence overview (re-summarized
          from chunk summaries when the transcript spans multiple chunks).
        • Detailed summary – each chunk is summarized individually and the
          results are concatenated, preserving detail for long videos.
        """

        if not transcript:
            raise ValueError("Transcript is empty")

        transcript = self.clean_text(transcript)
        total_words = len(transcript.split())

        chunks = self.chunk_text(transcript)

        # --- Detailed summary: summarize each chunk, then combine ---
        partial_detailed = []

        for chunk in chunks:
            chunk_words = len(chunk.split())
            d_max, d_min = self._compute_detailed_lengths(chunk_words)

            detailed = self.summarize_chunk(
                chunk, max_length=d_max, min_length=d_min
            )
            partial_detailed.append(detailed)

        # Concatenate chunk summaries without re-summarizing so detail
        # is preserved for long videos.
        detailed_summary = " ".join(partial_detailed)

        # --- Short summary: concise overview ---
        if len(chunks) == 1:
            s_max, s_min = self._compute_short_lengths(total_words)
            short_summary = self.summarize_chunk(
                chunks[0], max_length=s_max, min_length=s_min
            )
        else:
            # Summarize each chunk briefly, combine, then re-summarize
            # the combination into a single concise overview.
            partial_short = []

            for chunk in chunks:
                chunk_words = len(chunk.split())
                s_max, s_min = self._compute_short_lengths(chunk_words)

                short = self.summarize_chunk(
                    chunk, max_length=s_max, min_length=s_min
                )
                partial_short.append(short)

            combined_short = " ".join(partial_short)

            # Compute lengths from the *actual* re-summarization input
            # (combined_short), not from the full transcript word count.
            # Using total_words here could produce a max_length larger than
            # the combined_short token count, triggering the HuggingFace
            # "max_length > input_length" warning.
            combined_short_words = len(combined_short.split())
            s_max, s_min = self._compute_short_lengths(combined_short_words)
            short_summary = self.summarize_chunk(
                combined_short, max_length=s_max, min_length=s_min
            )

        return {
            "short_summary": short_summary,
            "detailed_summary": detailed_summary,
            "model_used": self.model_name,
        }

    # -----------------------------------------------------

    def generate_all_summaries(self, transcript: str) -> dict:
        """
        Generate both short and detailed summaries.
        """
        return self.summarize(transcript)