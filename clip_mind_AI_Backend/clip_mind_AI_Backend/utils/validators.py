"""
Shared validators for ClipMind AI.
"""
import re
from django.core.exceptions import ValidationError


ALLOWED_VIDEO_EXTENSIONS = {"mp4", "mov", "avi", "mkv", "webm"}
MAX_VIDEO_SIZE_BYTES = 2 * 1024 * 1024 * 1024  # 2 GB
YOUTUBE_URL_PATTERN = re.compile(
    r"^(https?://)?((www|m)\.)?"
    r"(youtube\.com/(watch\?v=|shorts/|embed/|v/)|youtu\.be/)"
    r"[\w\-]{11}([?&#].*)?$"
)

PASSWORD_PATTERN = re.compile(
    r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
)


# Container signatures checked against the first bytes of an upload, so a
# renamed executable cannot pass validation on its extension alone.
#   MP4/MOV : ISO-BMFF — 4-byte size, then 'ftyp' at offset 4
#   AVI     : 'RIFF' .... 'AVI '
#   MKV/WEBM: EBML header 1A 45 DF A3
_MAGIC_EBML = b"\x1a\x45\xdf\xa3"


def _looks_like_video(header: bytes) -> bool:
    """True if `header` (>= 12 bytes) starts with a known video container signature."""
    if len(header) < 12:
        return False
    if header[4:8] == b"ftyp":                       # MP4 / MOV / M4V
        return True
    if header[:4] == b"RIFF" and header[8:12] == b"AVI ":
        return True
    if header[:4] == _MAGIC_EBML:                    # MKV / WEBM
        return True
    return False


def validate_video_file(file) -> None:
    """
    Validate that an upload is a real video file within the size limit.

    Checks extension, size, AND the container magic bytes — extension alone is
    trivially spoofed by renaming a file.
    """
    ext = file.name.rsplit(".", 1)[-1].lower() if "." in file.name else ""
    if ext not in ALLOWED_VIDEO_EXTENSIONS:
        raise ValidationError(
            f"Unsupported file format '{ext}'. Allowed: {', '.join(sorted(ALLOWED_VIDEO_EXTENSIONS))}."
        )
    if file.size > MAX_VIDEO_SIZE_BYTES:
        raise ValidationError("File size exceeds the 2 GB limit.")
    if file.size == 0:
        raise ValidationError("The uploaded file is empty.")

    # Inspect the header, then rewind so the file can still be saved intact.
    try:
        position = file.tell()
    except (AttributeError, OSError):
        position = 0
    try:
        file.seek(0)
        header = file.read(12)
    finally:
        try:
            file.seek(position)
        except (AttributeError, OSError):
            pass

    if not _looks_like_video(header):
        raise ValidationError(
            "This file does not appear to be a valid video. "
            "Please upload a genuine MP4, MOV, AVI, MKV or WebM file."
        )


def validate_youtube_url(url: str) -> None:
    """Raise ValidationError if url is not a valid YouTube URL."""
    if not YOUTUBE_URL_PATTERN.match(url):
        raise ValidationError("Invalid YouTube URL.")


# ISO-639-1 codes offered as optional source-language hints for transcription.
# (Whisper has no Haryanvi code — "hi" is the closest for Haryanvi content.)
SUPPORTED_LANGUAGE_CODES = {
    "en", "hi", "ur", "pa", "mr", "gu", "ta", "te", "bn", "kn", "ml",
    "es", "fr", "de", "ar", "ru", "pt", "ja", "ko", "zh",
}


def normalize_language_hint(value) -> str:
    """
    Return a valid lowercase ISO-639-1 language code, or "" for auto-detect.
    Unknown/empty values fall back to "" so the existing auto-detect workflow
    is preserved.
    """
    if not value:
        return ""
    code = str(value).strip().lower()
    return code if code in SUPPORTED_LANGUAGE_CODES else ""


def validate_password_strength(password: str) -> None:
    """
    Raise ValidationError if password does not meet strength requirements.
    Must have: 8+ chars, upper, lower, digit, special char.
    """
    if not PASSWORD_PATTERN.match(password):
        raise ValidationError(
            "Password must be at least 8 characters and include uppercase, "
            "lowercase, a digit, and a special character (@$!%*?&)."
        )
