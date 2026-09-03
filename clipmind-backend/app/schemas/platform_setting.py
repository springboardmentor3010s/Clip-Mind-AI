from pydantic import BaseModel, Field


class PlatformSettingResponse(BaseModel):
    maintenance_mode: bool
    ai_processing_enabled: bool
    max_upload_size_mb: float
    allow_public_registration: bool

    class Config:
        from_attributes = True


class PlatformSettingUpdate(BaseModel):
    maintenance_mode: bool | None = None

    ai_processing_enabled: bool | None = None

    max_upload_size_mb: float | None = Field(
        default=None,
        gt=0
    )

    allow_public_registration: bool | None = None