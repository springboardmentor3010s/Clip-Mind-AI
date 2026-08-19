from sqlalchemy.orm import Session

from app.models.platform_settings import PlatformSettings


def get_platform_settings(db: Session) -> PlatformSettings:
    settings = db.query(PlatformSettings).filter(PlatformSettings.id == 1).first()
    if not settings:
        settings = PlatformSettings(id=1)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings
