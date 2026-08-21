from app.services.processing_service import extract_video_metadata

video_path = "uploads/videos/0f1b629c-0330-4484-9285-dbb6d47ee75b.mp4"

metadata = extract_video_metadata(video_path)

print(metadata)