"""
DistilBART-based text summarization service (lighter & faster than
facebook/bart-large-cnn, similar quality). Generates short and
detailed summaries, can shorten an existing summary further, and
can reformat a summary into bullet points.
"""

import re
from transformers import pipeline

_summarizer = None


def get_summarizer():
    global _summarizer
    if _summarizer is None:
        print("[BART] Loading summarization model (first run may take a while)...")
        _summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6")
        print("[BART] Model loaded.")
    return _summarizer


def chunk_text(text: str, max_words: int = 600) -> list[str]:
    words = text.split()
    return [" ".join(words[i:i + max_words]) for i in range(0, len(words), max_words)]


def generate_summary(text: str) -> dict:
    summarizer = get_summarizer()

    if not text or len(text.split()) < 30:
        return {
            "short_summary": text,
            "detailed_summary": text,
        }

    chunks = chunk_text(text)
    chunk_summaries = []

    for chunk in chunks:
        word_count = len(chunk.split())
        max_len = min(130, max(30, word_count // 2))
        min_len = min(30, max_len - 10) if max_len > 10 else 5
        result = summarizer(chunk, max_length=max_len, min_length=min_len, do_sample=False)
        chunk_summaries.append(result[0]["summary_text"].strip())

    detailed_summary = " ".join(chunk_summaries)

    if len(detailed_summary.split()) > 60:
        short_result = summarizer(detailed_summary, max_length=60, min_length=20, do_sample=False)
        short_summary = short_result[0]["summary_text"].strip()
    else:
        short_summary = detailed_summary

    return {
        "short_summary": short_summary,
        "detailed_summary": detailed_summary,
    }


def shorten_summary(text: str, max_words: int = 40) -> str:
    summarizer = get_summarizer()
    word_count = len(text.split())
    if word_count <= max_words:
        return text
    max_len = min(60, max(15, max_words))
    min_len = min(10, max_len - 5) if max_len > 5 else 5
    result = summarizer(text, max_length=max_len, min_length=min_len, do_sample=False)
    return result[0]["summary_text"].strip()


def bulletify_summary(text: str) -> list[str]:
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    return [s.strip() for s in sentences if s.strip()]