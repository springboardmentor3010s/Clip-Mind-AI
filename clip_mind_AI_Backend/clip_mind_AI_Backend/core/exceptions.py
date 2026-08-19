"""
Custom exceptions for ClipMind AI.
Each exception maps to a specific HTTP status code.
"""
from rest_framework.exceptions import APIException
from rest_framework import status


class ServiceUnavailableError(APIException):
    """Raised when an external service (AI provider, etc.) is unavailable."""
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = "Service temporarily unavailable."
    default_code = "service_unavailable"


class AIProviderError(APIException):
    """Raised when all AI providers fail."""
    status_code = status.HTTP_502_BAD_GATEWAY
    default_detail = "AI provider error. Please try again."
    default_code = "ai_provider_error"


class VideoProcessingError(APIException):
    """Raised when video processing fails."""
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    default_detail = "Video processing failed."
    default_code = "video_processing_error"


class InvalidFileError(APIException):
    """Raised when uploaded file is invalid."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Invalid file."
    default_code = "invalid_file"


class PermissionDeniedError(APIException):
    """Raised when user lacks permission for an action."""
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "You do not have permission to perform this action."
    default_code = "permission_denied"


class ResourceNotFoundError(APIException):
    """Raised when a requested resource does not exist."""
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "Resource not found."
    default_code = "not_found"


class AuthenticationFailedError(APIException):
    """Raised on authentication failure."""
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = "Authentication failed."
    default_code = "authentication_failed"
