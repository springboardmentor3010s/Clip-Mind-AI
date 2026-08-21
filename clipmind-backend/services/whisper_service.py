"""
Speech-to-text using faster-whisper.

The model is loaded lazily and cached at module scope so it is only
downloaded/loaded once per backend process, not once per request.
"""
from config import WHISPER_MODEL_SIZE, WHISPER_DEVICE, WHISPER_COMPUTE_TYPE
from services.time_utils import fmt

_model = None


def _get_model():
    global _model
    if _model is None:
        from faster_whisper import WhisperModel
        _model = WhisperModel(
            WHISPER_MODEL_SIZE, device=WHISPER_DEVICE, compute_type=WHISPER_COMPUTE_TYPE
        )
    return _model


def transcribe(audio_path: str):
    """
    Runs faster-whisper on the given wav file.

    Returns (segments, language) where segments is a list of dicts already
    shaped like the frontend's TranscriptSegment:
      { id, seconds, time, speaker, text }

    Real diarization is out of scope for this MVP, so every segment is
    attributed to a generic "Speaker" label rather than faking multiple
    identified speakers.
    """
    model = _get_model()
    raw_segments, info = model.transcribe(audio_path, beam_size=5, vad_filter=True)

    segments = []
    for i, seg in enumerate(raw_segments):
        text = (seg.text or "").strip()
        if not text:
            continue
        segments.append({
            "id": f"seg-{i}",
            "seconds": round(seg.start, 2),
            "time": fmt(seg.start),
            "speaker": "Speaker",
            "text": text,
        })

    language = (info.language or "en").upper() if info else "EN"
    language_label = f"{language} (auto-detected)"
    return segments, language_label
