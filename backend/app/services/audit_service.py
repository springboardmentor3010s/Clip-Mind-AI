"""
Audit logging service. Call log_action() from wherever a notable action
happens (auth, user management, video moderation) rather than building
logging into each individual model — keeps the instrumentation to one
line per call site.
"""
import uuid

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def log_action(
    db: Session,
    actor_id: uuid.UUID,
    action: str,
    target_type: str | None = None,
    target_id: uuid.UUID | None = None,
    detail: str | None = None,
) -> None:
    """
    Record an audit log entry. Failure to log should never break the
    action it's describing, so this swallows its own errors rather than
    letting a logging bug take down, say, a login.
    """
    try:
        entry = AuditLog(
            actor_id=actor_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            detail=detail,
        )
        db.add(entry)
        db.commit()
    except Exception:
        db.rollback()