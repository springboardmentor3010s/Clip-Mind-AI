"""
Utility helpers for ClipMind AI.
"""
import uuid
import logging

logger = logging.getLogger("utils")


def generate_uuid() -> str:
    """Generate a new UUID4 string."""
    return str(uuid.uuid4())


def mask_email(email: str) -> str:
    """Mask an email address for safe logging. e.g. u***@example.com"""
    try:
        local, domain = email.split("@", 1)
        masked_local = local[0] + "***" if len(local) > 1 else "***"
        return f"{masked_local}@{domain}"
    except Exception:
        return "***"
