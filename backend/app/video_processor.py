import os
import json
import subprocess

UPLOAD_DIR = os.path.abspath("./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def probe_video(file_path: str) -> dict:
    """Uses ffprobe / ffmpeg to analyze video file properties"""
    if not os.path.exists(file_path):
        return {"duration": 0, "width": 1280, "height": 720, "format": "mp4", "size": 0}

    file_size = os.path.getsize(file_path)
    
    # Run ffprobe to get precise metadata
    cmd = [
        "ffprobe",
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        file_path
    ]
    
    try:
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        data = json.loads(res.stdout)
        
        format_info = data.get("format", {})
        duration = float(format_info.get("duration", 0))
        
        width = 1280
        height = 720
        fps = 30.0
        
        for stream in data.get("streams", []):
            if stream.get("codec_type") == "video":
                width = int(stream.get("width", 1280))
                height = int(stream.get("height", 720))
                r_frame_rate = stream.get("r_frame_rate", "30/1")
                if "/" in r_frame_rate:
                    num, den = r_frame_rate.split("/")
                    if float(den) > 0:
                        fps = round(float(num) / float(den), 2)
                break
                
        return {
            "duration": round(duration, 2),
            "width": width,
            "height": height,
            "format": format_info.get("format_name", "mp4").split(",")[0],
            "size": file_size,
            "fps": fps,
            "audioBitrate": "128k"
        }
    except Exception as e:
        print(f"Error probing video with ffprobe: {e}")
        # Return sensible defaults based on file size
        est_duration = max(15.0, round(file_size / (500 * 1024), 1))
        return {
            "duration": est_duration,
            "width": 1920,
            "height": 1080,
            "format": os.path.splitext(file_path)[1].lstrip('.'),
            "size": file_size,
            "fps": 30.0,
            "audioBitrate": "128k"
        }

def extract_audio(video_path: str, output_wav_path: str) -> str:
    """Extracts 16kHz mono audio WAV file from video using FFmpeg"""
    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "16000",
        "-ac", "1",
        output_wav_path
    ]
    try:
        subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        return output_wav_path
    except Exception as e:
        print(f"Error extracting audio with FFmpeg: {e}")
        return output_wav_path

def generate_thumbnail(video_path: str, thumbnail_path: str) -> str:
    """Extracts a frame at 1s timestamp for thumbnail display"""
    cmd = [
        "ffmpeg", "-y",
        "-ss", "00:00:01",
        "-i", video_path,
        "-vframes", "1",
        "-q:v", "2",
        thumbnail_path
    ]
    try:
        subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        return thumbnail_path
    except Exception as e:
        print(f"Error generating thumbnail with FFmpeg: {e}")
        return thumbnail_path
