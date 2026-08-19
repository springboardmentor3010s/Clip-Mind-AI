from pydantic import BaseModel


class PlatformSettingsResponse(BaseModel):
    maintenance_mode: bool
    allow_new_registrations: bool
    max_upload_size_mb: int

    class Config:
        from_attributes = True


class PlatformSettingsUpdate(BaseModel):
    maintenance_mode: bool
    allow_new_registrations: bool
    max_upload_size_mb: int
