# backend/app/core/processing.py
import subprocess
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("VideoPipeline")

THUMBNAIL_DIR = os.path.join(os.getcwd(), "storage", "thumbnails")
os.makedirs(THUMBNAIL_DIR, exist_ok=True)

def process_video_pipeline(video_path: str, filename: str):
    """
    Executes an automated FFmpeg pipeline task:
    1. Extracts a 720p jpeg thumbnail snapshot at the 2-second mark.
    """
    base_name = os.path.splitext(filename)[0]
    thumbnail_path = os.path.join(THUMBNAIL_DIR, f"{base_name}_thumb.jpg")
    
    logger.info(f"Starting FFmpeg processing pipeline for: {filename}")
    
    # 🌟 Point directly to the exact location of your extracted FFmpeg executable file:
    ffmpeg_exe = r"C:\ffmpeg\bin\ffmpeg.exe"
    
    # Construct arguments using individual array blocks (safer than raw string joining)
    ffmpeg_cmd = [
        ffmpeg_exe, "-y",              # Use the absolute path to the executable
        "-ss", "00:00:02",             # Seek to the 2-second mark
        "-i", video_path,              # Input video path
        "-vframes", "1",               # Extract exactly one frame
        "-vf", "scale=1280:720",       # Scale snapshot to crisp 720p
        thumbnail_path                 # Destination path
    ]
    
    try:
        # Execute natively without shell wrapper dependencies
        result = subprocess.run(
            ffmpeg_cmd, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE, 
            text=True, 
            check=True
        )
        logger.info(f"FFmpeg pipeline completed successfully! Thumbnail saved to: {thumbnail_path}")
        return thumbnail_path
    except subprocess.CalledProcessError as e:
        logger.error(f"FFmpeg pipeline execution failed: {e.stderr}")
        return None