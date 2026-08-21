from app.services.processing_service import compress_video

video_path = r"C:\Users\rsamy\Desktop\clipmind ai\ClipMind-AI\backend\uploads\videos\0f1b629c-0330-4484-9285-dbb6d47ee75b.mp4"

compressed = compress_video(video_path)

print("Compressed Video:")
print(compressed)