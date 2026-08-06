from app.services.ffmpeg_service import extract_audio
from app.services.whisper_service import generate_transcript


def process_video(video_path):
    audio = extract_audio(video_path)

    transcript = generate_transcript(audio)

    return {
        "audio_path": audio,
        "transcript": transcript
    }