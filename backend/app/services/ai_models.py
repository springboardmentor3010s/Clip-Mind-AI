"""
Lazy-loaded, cached AI models shared across the app.
Loading Whisper and BART onto the GPU takes several seconds, so each model
is loaded once on first use and reused for every subsequent request.
"""
import torch
import whisper
from transformers import pipeline

_whisper_model = None
_summarizer = None

WHISPER_MODEL_SIZE = "small"
SUMMARIZER_MODEL_NAME = "facebook/bart-large-cnn"

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        print(f"[ai_models] Loading Whisper on device: {DEVICE}")
        _whisper_model = whisper.load_model(WHISPER_MODEL_SIZE, device=DEVICE)
    return _whisper_model


def get_summarizer():
    global _summarizer
    if _summarizer is None:
        print(f"[ai_models] Loading BART summarizer on device: {DEVICE}")
        _summarizer = pipeline(
            "summarization",
            model=SUMMARIZER_MODEL_NAME,
            device=0 if DEVICE == "cuda" else -1,
        )
    return _summarizer