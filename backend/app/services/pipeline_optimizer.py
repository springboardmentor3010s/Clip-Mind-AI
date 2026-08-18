"""
Background Async Task Pipeline for High-Throughput Video Ingestion
"""
import asyncio
import os
import subprocess
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=3)

def extract_audio_task(video_path: str, output_audio_path: str) -> bool:
    """Executes non-blocking FFmpeg extraction in a dedicated thread."""
    command = [
        "ffmpeg", "-y", "-i", video_path,
        "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
        output_audio_path
    ]
    try:
        subprocess.run(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        return True
    except Exception as e:
        print(f"FFmpeg extraction failed: {e}")
        return False

async def async_extract_audio(video_path: str, output_audio_path: str) -> bool:
    """Async wrapper ensuring main event loop is never blocked."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, extract_audio_task, video_path, output_audio_path)