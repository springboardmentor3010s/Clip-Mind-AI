"""
Lazy-loaded, cached AI models shared across the app.
Loading Whisper and BART onto the GPU takes several seconds, so each model
is loaded once on first use and reused for every subsequent request.
"""
import torch
import whisper
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

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


class _Summarizer:
    """
    transformers v5 removed the pipeline("summarization") task shortcut
    (huggingface/transformers#44509), so this loads BART directly via
    AutoModelForSeq2SeqLM and calls .generate() itself. __call__ mirrors
    the old pipeline's signature and [{"summary_text": ...}] return shape
    so summary_service.py needs no changes.
    """

    def __init__(self, model_name: str, device: str):
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
        self.device = device
        self.model.to(self.device)
        self.model.eval()

    @torch.inference_mode()
    def __call__(self, text: str, max_length: int = 150, min_length: int = 20, do_sample: bool = False):
        inputs = self.tokenizer(
            text, return_tensors="pt", truncation=True, max_length=1024
        ).to(self.device)
        output_ids = self.model.generate(
            **inputs,
            max_length=max_length,
            min_length=min_length,
            do_sample=do_sample,
            num_beams=4,
        )
        summary = self.tokenizer.decode(output_ids[0], skip_special_tokens=True)
        return [{"summary_text": summary}]


def get_summarizer():
    global _summarizer
    if _summarizer is None:
        print(f"[ai_models] Loading BART summarizer on device: {DEVICE}")
        _summarizer = _Summarizer(SUMMARIZER_MODEL_NAME, DEVICE)
    return _summarizer