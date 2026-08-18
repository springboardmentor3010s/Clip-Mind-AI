import whisper
import os

# Lazy loading model instance
_whisper_model = None

def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        # Options: "tiny", "base", "small", "medium", "large"
        _whisper_model = whisper.load_model("base")
    return _whisper_model

def generate_transcript(audio_path: str) -> dict:
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    model = get_whisper_model()
    result = model.transcribe(audio_path, verbose=False)
    
    formatted_segments = []
    for segment in result.get("segments", []):
        formatted_segments.append({
            "id": segment["id"],
            "start": round(segment["start"], 2),
            "end": round(segment["end"], 2),
            "text": segment["text"].strip()
        })

    return {
    "full_text": result["text"].strip(),
    "segments": formatted_segments
}