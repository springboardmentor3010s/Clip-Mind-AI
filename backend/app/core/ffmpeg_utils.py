# backend/app/core/ffmpeg_utils.py
import subprocess
import os

AUDIO_DIR = os.path.join(os.getcwd(), "storage", "extracted_audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

def extract_audio_from_video(video_path: str) -> str:
    """
    Uses containerized system FFmpeg commands via subprocess arrays to 
    demux audio streams out of video files into optimized mono 16kHz WAV profiles.
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Source asset not found at target directory: {video_path}")
        
    base_name = os.path.splitext(os.path.basename(video_path))[0]
    output_audio_path = os.path.join(AUDIO_DIR, f"{base_name}.wav")
    
    # FFmpeg Configuration Parameters:
    # -y: Auto-overwrite existing output assets
    # -i: target source asset path input parameter array
    # -vn: Disable video recording vectors (strip video entirely)
    # -acodec pcm_s16le: Set raw 16-bit uncompressed audio profile code
    # -ar 16000: Downsample frequencies to 16kHz (optimal constraint for Whisper ASR engine inputs)
    # -ac 1: Compress channels down to single mono tracking
    ffmpeg_cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "16000",
        "-ac", "1",
        output_audio_path
    ]
    
    try:
        # Trigger processing via host shell structures safely
        result = subprocess.run(ffmpeg_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        return output_audio_path
    except subprocess.CalledProcessError as e:
        error_msg = e.stderr.decode() if e.stderr else "Unknown system runtime breakdown"
        raise RuntimeError(f"FFmpeg command processing failure block: {error_msg}")