import whisper

# Load the model only once
model = whisper.load_model("base")


def generate_transcript(audio_path: str):
    result = model.transcribe(audio_path)
    return result["text"]