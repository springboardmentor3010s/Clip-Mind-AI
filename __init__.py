"""
Pydantic schemas package.
"""
from app.schemas.auth import Token, TokenPayload, RegisterRequest, LoginRequest
from app.schemas.role import RoleBase, RoleCreate, RoleRead, RoleUpdate
from app.schemas.user import UserBase, UserCreate, UserRead, UserUpdate, UserProfile
from app.schemas.video import VideoBase, VideoCreate, VideoRead, VideoUpdate, VideoUploadResponse
from app.schemas.transcript import TranscriptBase, TranscriptCreate, TranscriptRead, TranscriptUpdate
from app.schemas.transcript_validation import (
    TranscriptValidationMetrics,
    TranscriptValidationFlags,
    TranscriptValidationResponse,
)
from app.schemas.summary import SummaryBase, SummaryCreate, SummaryRead, SummaryUpdate
from app.schemas.key_moment import KeyMomentBase, KeyMomentCreate, KeyMomentRead, KeyMomentUpdate
from app.schemas.analytics import AnalyticsBase, AnalyticsCreate, AnalyticsRead, AnalyticsUpdate
from app.schemas.bookmark import BookmarkCreate, BookmarkResponse


__all__ = [
    "Token",
    "TokenPayload",
    "RegisterRequest",
    "LoginRequest",
    "RoleBase",
    "RoleCreate",
    "RoleRead",
    "RoleUpdate",
    "UserBase",
    "UserCreate",
    "UserRead",
    "UserUpdate",
    "UserProfile",
    "VideoBase",
    "VideoCreate",
    "VideoRead",
    "VideoUpdate",
    "VideoUploadResponse",
    "TranscriptBase",
    "TranscriptCreate",
    "TranscriptRead",
    "TranscriptUpdate",
    "TranscriptValidationMetrics",
    "TranscriptValidationFlags",
    "TranscriptValidationResponse",
    "SummaryBase",
    "SummaryCreate",
    "SummaryRead",
    "SummaryUpdate",
    "KeyMomentBase",
    "KeyMomentCreate",
    "KeyMomentRead",
    "KeyMomentUpdate",
    "AnalyticsBase",
    "AnalyticsCreate",
    "AnalyticsRead",
    "AnalyticsUpdate",
    "BookmarkCreate",
    "BookmarkResponse",
]