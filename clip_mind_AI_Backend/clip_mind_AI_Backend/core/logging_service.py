"""
Activity and audit recording helpers.

Two distinct trails are kept:

  ActivityLog — what a *user* did. Surfaces as "Activity history" for the user
                and "Recent Platform Activity" for administrators.
  AuditLog    — what an *administrator* did. Accountability trail for
                privileged actions (role changes, deletions, settings edits).

Both helpers are intentionally failure-tolerant: logging must never break the
request that triggered it, so exceptions are swallowed and reported to the
application log instead.
"""
import logging

logger = logging.getLogger("api")


def client_ip(request):
    """Best-effort client IP, honouring X-Forwarded-For behind a proxy/ALB."""
    if request is None:
        return None
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def record_activity(user, action, description="", target_id="", target_type=""):
    """Record a user-facing activity entry. Never raises."""
    from apps.accounts.models import ActivityLog

    if not user or not getattr(user, "is_authenticated", False):
        return None
    try:
        return ActivityLog.objects.create(
            user=user,
            action=action,
            description=description[:500],
            target_id=str(target_id or "")[:64],
            target_type=target_type[:40],
        )
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning("Failed to record activity | action=%s | error=%s", action, exc)
        return None


def record_audit(actor, action, target_type="", target_id="", detail="", request=None):
    """Record an administrative audit entry. Never raises."""
    from apps.accounts.models import AuditLog

    try:
        return AuditLog.objects.create(
            actor=actor if getattr(actor, "is_authenticated", False) else None,
            actor_email=getattr(actor, "email", "") or "",
            action=action[:80],
            target_type=target_type[:40],
            target_id=str(target_id or "")[:64],
            detail=detail,
            ip_address=client_ip(request),
        )
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning("Failed to record audit | action=%s | error=%s", action, exc)
        return None
