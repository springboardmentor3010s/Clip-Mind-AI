"""
Minimal transactional email sender.

Used for password reset and video share notifications. Uses the standard
library's smtplib so no new dependency is required. If SMTP credentials
aren't configured yet (local/dev), messages are printed to the console
instead of raising — this keeps both flows fully testable before real
email is wired up.
"""
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings


def _smtp_configured() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD)


def _send_email(to_email: str, subject: str, body: str, console_fallback: str) -> None:
    if not _smtp_configured():
        print(f"[email_service] SMTP not configured — {console_fallback}")
        return

    message = MIMEMultipart()
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = to_email
    message["Subject"] = subject
    message.attach(MIMEText(body, "plain"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM_EMAIL, to_email, message.as_string())


def send_password_reset_email(to_email: str, reset_link: str) -> None:
    subject = "Reset your ClipMind AI password"
    body = (
        "We received a request to reset your ClipMind AI password.\n\n"
        f"Click the link below to choose a new password. This link expires in "
        f"{settings.PASSWORD_RESET_EXPIRE_MINUTES} minutes.\n\n"
        f"{reset_link}\n\n"
        "If you didn't request this, you can safely ignore this email."
    )
    _send_email(to_email, subject, body, console_fallback=f"password reset link for {to_email}: {reset_link}")


def send_share_notification_email(to_email: str, shared_by_name: str, video_title: str, video_link: str) -> None:
    subject = f"{shared_by_name} shared a video with you on ClipMind AI"
    body = (
        f"{shared_by_name} shared \"{video_title}\" with you on ClipMind AI.\n\n"
        f"View it here:\n{video_link}\n\n"
        "You'll also find it under \"Shared with Me\" the next time you log in."
    )
    _send_email(to_email, subject, body, console_fallback=f"share notification for {to_email}: {video_link}")