"""
Activity service: helper for recording platform activity and audit trail entries.
"""
from typing import Optional

from starlette.requests import Request
from sqlalchemy.orm import Session

from app.models.activity_log import ActivityLog

def _client_ip(request: Optional[Request]) -> Optional[str]:
    """Extract a best-effort client IP from the request."""
    if request is None:
        return None
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


def log_activity(
    db: Session,
    user_id: int,
    action: str,
    resource_type: Optional[str] = None,
    resource_id: Optional[int] = None,
    description: Optional[str] = None,
    request: Optional[Request] = None,
) -> ActivityLog:
    """
    Record an activity/audit log entry.

    Args:
        db: Database session.
        user_id: The acting user (use the admin performing an action).
        action: Short machine action name, e.g. "user.create", "login".
        resource_type: Optional type of affected resource, e.g. "user", "video".
        resource_id: Optional id of the affected resource.
        description: Human-readable detail.
        request: Optional request to capture IP / user agent.
    """
    entry = ActivityLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        description=description,
        ip_address=_client_ip(request),
        user_agent=(request.headers.get("user-agent") if request else None),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry