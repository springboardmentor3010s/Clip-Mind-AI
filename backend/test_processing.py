from app.services.processing_service import (
    extract_video_metadata,
    generate_thumbnail
)

video_path = r"C:\Users\rsamy\Desktop\clipmind ai\ClipMind-AI\backend\uploads\videos\0f1b629c-0330-4484-9285-dbb6d47ee75b.mp4"

print("Metadata:")
print(extract_video_metadata(video_path))

thumbnail = generate_thumbnail(video_path)

print("\nThumbnail created at:")
print(thumbnail)