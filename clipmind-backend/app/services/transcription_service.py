import os
import json
import whisper


model = whisper.load_model("base")


def transcribe_audio(audio_path: str):

    result = model.transcribe(audio_path)

    os.makedirs("transcripts", exist_ok=True)

    filename = os.path.splitext(
        os.path.basename(audio_path)
    )[0]

    transcript_path = os.path.join(
        "transcripts",
        f"{filename}.txt"
    )

    with open(
        transcript_path,
        "w",
        encoding="utf-8"
    ) as file:
        file.write(result["text"])

    # Save Whisper segments
    segments_path = os.path.join(
        "transcripts",
        f"{filename}_segments.json"
    )

    with open(
        segments_path,
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(
            result["segments"],
            file,
            indent=4,
            ensure_ascii=False
        )

    return (
    transcript_path,
    result["text"],
    result["language"],
    result["segments"]
)