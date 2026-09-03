from sqlalchemy.orm import Session

from app.models.platform_setting import PlatformSetting


def get_platform_settings(
    db: Session
):
    settings = (
        db.query(PlatformSetting)
        .first()
    )

    if settings is None:
        settings = PlatformSetting(
            maintenance_mode=False,
            ai_processing_enabled=True,
            max_upload_size_mb=500.0,
            allow_public_registration=True
        )

        db.add(settings)
        db.commit()
        db.refresh(settings)

    return settings


def update_platform_settings(
    db: Session,
    settings: PlatformSetting,
    maintenance_mode=None,
    ai_processing_enabled=None,
    max_upload_size_mb=None,
    allow_public_registration=None
):
    if maintenance_mode is not None:
        settings.maintenance_mode = maintenance_mode

    if ai_processing_enabled is not None:
        settings.ai_processing_enabled = (
            ai_processing_enabled
        )

    if max_upload_size_mb is not None:
        settings.max_upload_size_mb = (
            max_upload_size_mb
        )

    if allow_public_registration is not None:
        settings.allow_public_registration = (
            allow_public_registration
        )

    db.commit()
    db.refresh(settings)

    return settings