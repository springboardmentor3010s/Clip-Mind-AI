"""
Faster-Whisper based speech-to-text transcription service.
Includes filler-word cleanup as a post-processing option.
"""

import re
import time
from faster_whisper import WhisperModel

_model = None


def get_model():
    global _model
    if _model is None:
        print("[Whisper] Loading model (first run may take a while)...")
        _model = WhisperModel("small", device="cpu", compute_type="int8")
        print("[Whisper] Model loaded.")
    return _model


def transcribe_audio(audio_path: str, language: str | None = None) -> dict:
    model = get_model()

    lang_param = None
    if language and language != "auto":
        lang_param = language

    start_time = time.time()
    segments_iter, info = model.transcribe(audio_path, language=lang_param, beam_size=5)

    segments = []
    logprobs = []
    for seg in segments_iter:
        segments.append({
            "start": round(seg.start, 2),
            "end": round(seg.end, 2),
            "text": seg.text.strip(),
        })
        logprobs.append(seg.avg_logprob)

    processing_time = round(time.time() - start_time, 2)
    full_text = " ".join(s["text"] for s in segments)

    avg_logprob = sum(logprobs) / max(len(logprobs), 1)
    confidence_pct = round(max(0, min(100, (avg_logprob + 1) * 100)), 1)

    return {
        "language": info.language,
        "text": full_text,
        "segments": segments,
        "processing_time_seconds": processing_time,
        "confidence_score": confidence_pct,
    }


FILLER_WORDS = {
    "um", "uh", "uhh", "umm", "erm", "ah", "hmm", "like", "you know",
    "i mean", "sort of", "kind of", "basically", "actually", "literally",
    "so yeah", "right", "well",
}


def clean_filler_words(segments: list[dict]) -> list[dict]:
    cleaned = []
    for seg in segments:
        text = seg["text"]
        for filler in sorted(FILLER_WORDS, key=len, reverse=True):
            pattern = r"\b" + re.escape(filler) + r"\b[,]?"
            text = re.sub(pattern, "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s+", " ", text).strip()
        text = re.sub(r"\s+([.,!?])", r"\1", text)
        cleaned.append({**seg, "text": text if text else seg["text"]})
    return cleaned