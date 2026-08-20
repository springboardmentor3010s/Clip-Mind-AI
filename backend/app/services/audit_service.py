from app.models.audit_log import AuditLog


def create_audit_log(
    db,
    action,
    description=None,
    user_id=None,
    username=None,
    entity_type=None,
    entity_id=None
):

    log = AuditLog(

        user_id=user_id,

        username=username,

        action=action,

        description=description,

        entity_type=entity_type,

        entity_id=entity_id

    )

    db.add(log)

    db.commit()

    return log