import whisper

# Load Whisper model only once
model = whisper.load_model("base")

def generate_transcript(video_path):
    """
    Generate transcript from uploaded video.
    """

    result = model.transcribe(video_path)

    return result["text"]