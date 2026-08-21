from app.services.transcription_service import transcribe_video

video_path = r"C:\Users\rsamy\Desktop\clipmind ai\ClipMind-AI\backend\uploads\videos\6cede5ad-e9d7-4766-9060-d6b52bbe8279.mp4"

text = transcribe_video(video_path)

print("\nTranscript:\n")
print(text)