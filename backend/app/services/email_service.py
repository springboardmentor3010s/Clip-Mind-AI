"""
Minimal transactional email sender.

Currently used for password reset only. Uses the standard library's smtplib
so no new dependency is required. If SMTP credentials aren't configured yet
(local/dev), the reset link is printed to the console instead of raising —
this keeps the reset flow fully testable before real email is wired up.
"""
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings


def _smtp_configured() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD)


def send_password_reset_email(to_email: str, reset_link: str) -> None:
    subject = "Reset your ClipMind AI password"
    body = (
        "We received a request to reset your ClipMind AI password.\n\n"
        f"Click the link below to choose a new password. This link expires in "
        f"{settings.PASSWORD_RESET_EXPIRE_MINUTES} minutes.\n\n"
        f"{reset_link}\n\n"
        "If you didn't request this, you can safely ignore this email."
    )

    if not _smtp_configured():
        print(f"[email_service] SMTP not configured — password reset link for {to_email}: {reset_link}")
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