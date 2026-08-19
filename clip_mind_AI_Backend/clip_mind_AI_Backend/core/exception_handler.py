"""
Global exception handler for DRF.
Maps all exceptions to the standard API response format.
"""
import logging
from rest_framework.views import exception_handler
from rest_framework.exceptions import ValidationError, AuthenticationFailed, NotAuthenticated
from rest_framework import status
from django.http import Http404
from django.core.exceptions import PermissionDenied

logger = logging.getLogger("api")


def custom_exception_handler(exc, context):
    """
    Custom exception handler that wraps all errors in the standard
    { success, message, errors } envelope.
    """
    # Let DRF handle the exception first to get its response
    response = exception_handler(exc, context)

    if response is not None:
        errors = response.data

        # Flatten validation errors into readable format
        if isinstance(exc, ValidationError):
            message = "Validation failed."
        elif isinstance(exc, (AuthenticationFailed, NotAuthenticated)):
            message = str(exc.detail) if hasattr(exc, "detail") else "Authentication failed."
        else:
            message = str(errors.get("detail", "An error occurred.")) if isinstance(errors, dict) else str(errors)

        response.data = {
            "success": False,
            "message": message,
            "errors": errors if not isinstance(errors, dict) or "detail" not in errors else {},
        }

        logger.warning(
            "API error | status=%s | path=%s | message=%s",
            response.status_code,
            context["request"].path,
            message,
        )

    else:
        # Unhandled exceptions
        logger.exception("Unhandled exception: %s", exc)
        from rest_framework.response import Response
        response = Response(
            {
                "success": False,
                "message": "Internal server error.",
                "errors": {},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return response
