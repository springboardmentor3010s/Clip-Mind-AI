"""
Evaluation Module: lightweight, reference-free quality metrics for the
Transcript Generation and Video Summarization modules.

We have no ground-truth transcripts/summaries to score against, so instead
of classic supervised metrics (WER, ROUGE) we compute practical proxies:

- Transcript confidence: derived from Whisper's own per-segment
  `avg_logprob` / `no_speech_prob`, which Whisper already calculates but
  the app was previously discarding.
- Summary compression ratio: how much shorter the summary is vs. the
  source transcript.
- Summary groundedness score: what fraction of the summary's vocabulary
  actually appears in the transcript. Low scores flag summaries that may
  be hallucinating content not present in the source.
"""
import math
import re

_STOPWORDS = {
    "a", "an", "the", "and", "or", "but", "if", "of", "to", "in", "on",
    "for", "with", "as", "is", "are", "was", "were", "be", "been", "being",
    "it", "its", "this", "that", "these", "those", "at", "by", "from",
    "into", "than", "then", "so", "such", "not", "no", "do", "does", "did",
    "has", "have", "had", "will", "would", "can", "could", "should", "may",
    "might", "we", "you", "they", "he", "she", "i", "his", "her", "their",
    "our", "your", "my",
}


def _significant_words(text: str) -> set[str]:
    words = re.findall(r"[a-z0-9']+", text.lower())
    return {w for w in words if w not in _STOPWORDS and len(w) > 2}


def compute_transcript_metrics(whisper_result: dict, processing_time_seconds: float) -> dict:
    """
    Derive a confidence score from Whisper's own segment-level statistics.

    avg_logprob is a log-probability (typically in roughly [-1, 0] for
    confident speech, more negative for garbled/uncertain audio). We
    convert it to a 0-1 "confidence" via exp(), then average across
    segments. no_speech_prob is averaged separately as a silence/noise
    indicator.
    """
    segments = whisper_result.get("segments", [])
    if not segments:
        return {
            "confidence_score": None,
            "avg_no_speech_prob": None,
            "segment_count": 0,
            "processing_time_seconds": round(processing_time_seconds, 2),
        }

    logprobs = [seg.get("avg_logprob", 0.0) for seg in segments]
    no_speech_probs = [seg.get("no_speech_prob", 0.0) for seg in segments]

    confidence_score = sum(math.exp(lp) for lp in logprobs) / len(logprobs)
    avg_no_speech_prob = sum(no_speech_probs) / len(no_speech_probs)

    return {
        "confidence_score": round(min(confidence_score, 1.0), 4),
        "avg_no_speech_prob": round(avg_no_speech_prob, 4),
        "segment_count": len(segments),
        "processing_time_seconds": round(processing_time_seconds, 2),
    }


def compute_summary_metrics(
    transcript_text: str,
    detailed_summary: str,
    short_summary: str,
    processing_time_seconds: float,
) -> dict:
    transcript_words = transcript_text.split()
    detailed_words = detailed_summary.split()
    short_words = short_summary.split()

    transcript_word_count = len(transcript_words)
    detailed_word_count = len(detailed_words)
    short_word_count = len(short_words)

    detailed_compression_ratio = (
        round(detailed_word_count / transcript_word_count, 4)
        if transcript_word_count else None
    )
    short_compression_ratio = (
        round(short_word_count / transcript_word_count, 4)
        if transcript_word_count else None
    )

    transcript_vocab = _significant_words(transcript_text)
    summary_vocab = _significant_words(detailed_summary)

    if summary_vocab:
        groundedness_score = round(
            len(summary_vocab & transcript_vocab) / len(summary_vocab), 4
        )
    else:
        groundedness_score = None

    return {
        "transcript_word_count": transcript_word_count,
        "detailed_summary_word_count": detailed_word_count,
        "short_summary_word_count": short_word_count,
        "detailed_compression_ratio": detailed_compression_ratio,
        "short_compression_ratio": short_compression_ratio,
        "groundedness_score": groundedness_score,
        "processing_time_seconds": round(processing_time_seconds, 2),
    }