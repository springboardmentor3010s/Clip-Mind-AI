"""Small helper for writing AuditLog rows — deliberately swallows failures
(an audit-log write should never break the action it's recording)."""
import logging
from typing import Optional
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def record_audit_event(
    db: Session,
    actor_user_id,
    action: str,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    detail: Optional[str] = None,
):
    try:
        from app.models.audit_log import AuditLog
        db.add(AuditLog(
            actor_user_id=actor_user_id,
            action=action,
            target_type=target_type,
            target_id=str(target_id) if target_id is not None else None,
            detail=detail,
        ))
        db.commit()
    except Exception as e:
        logger.error(f"Failed to record audit event '{action}': {e}")
