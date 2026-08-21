import whisper

# Load model once
model = whisper.load_model("base")


def generate_transcript(audio_path: str):

    result = model.transcribe(
        audio_path,
        fp16=False
    )

    transcript = result["text"]

    segments = result["segments"]

    detected_language = result["language"]

    print("Detected Language:", detected_language)

    return transcript, segments, detected_language