from config import WHISPER_MODEL_SIZE, WHISPER_DEVICE, WHISPER_COMPUTE_TYPE
from services.time_utils import fmt

_model = None


def _get_model():
    global _model

    print(">>> WHISPER: starting model load", flush=True)

    if _model is None:
        print(
            f">>> WHISPER: loading {WHISPER_MODEL_SIZE} "
            f"on {WHISPER_DEVICE} ({WHISPER_COMPUTE_TYPE})",
            flush=True
        )

        from faster_whisper import WhisperModel

        _model = WhisperModel(
            WHISPER_MODEL_SIZE,
            device=WHISPER_DEVICE,
            compute_type=WHISPER_COMPUTE_TYPE
        )

        print(">>> WHISPER: model loaded successfully", flush=True)

    return _model


def transcribe(audio_path: str):
    print(f">>> WHISPER: transcribing {audio_path}", flush=True)

    model = _get_model()

    print(">>> WHISPER: calling model.transcribe()", flush=True)

    raw_segments, info = model.transcribe(
        audio_path,
        beam_size=5,
        vad_filter=True
    )

    print(">>> WHISPER: transcription started", flush=True)

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

    print(
        f">>> WHISPER: transcription finished, {len(segments)} segments",
        flush=True
    )

    language = (info.language or "en").upper() if info else "EN"
    language_label = f"{language} (auto-detected)"

    return segments, language_label