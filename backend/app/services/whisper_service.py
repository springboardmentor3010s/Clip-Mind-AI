import os
import json

# Add FFmpeg to PATH only for this Python process
os.environ["PATH"] += os.pathsep + r"C:\Users\saisa\Downloads\ffmpeg-8.1.2-essentials_build\ffmpeg-8.1.2-essentials_build\bin"

import whisper

TRANSCRIPT_FOLDER = "uploads/transcripts"

os.makedirs(TRANSCRIPT_FOLDER, exist_ok=True)

# Load Whisper model once
model = whisper.load_model("tiny")


def merge_segments(segments, interval=6):
    """
    Merge Whisper segments into larger chunks (default: 6 seconds)
    """

    merged = []

    current_text = ""
    current_start = None

    for segment in segments:

        if current_start is None:
            current_start = segment["start"]

        current_text += " " + segment["text"].strip()

        if segment["end"] - current_start >= interval:

            merged.append({
                "start": current_start,
                "end": segment["end"],
                "text": current_text.strip()
            })

            current_start = None
            current_text = ""

    if current_text:

        merged.append({
            "start": current_start,
            "end": segments[-1]["end"],
            "text": current_text.strip()
        })

    return merged


def generate_transcript(audio_path):

    result = model.transcribe(audio_path)

    merged_segments = merge_segments(result["segments"], interval=6)

    filename = os.path.splitext(
        os.path.basename(audio_path)
    )[0]

    txt_path = os.path.join(
        TRANSCRIPT_FOLDER,
        f"{filename}.txt"
    )

    json_path = os.path.join(
        TRANSCRIPT_FOLDER,
        f"{filename}.json"
    )

    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(result["text"])

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(
            merged_segments,
            f,
            indent=4,
            ensure_ascii=False
        )

    return {
        "text": result["text"],
        "segments": merged_segments,
        "txt_path": txt_path,
        "json_path": json_path
    }