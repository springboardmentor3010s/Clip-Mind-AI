"""
Standard API response format for ClipMind AI.
All API responses go through these helpers.
"""
from rest_framework.response import Response
from rest_framework import status


def success_response(message: str = "Success", data=None, http_status: int = status.HTTP_200_OK) -> Response:
    """Return a standardised success response."""
    payload = {
        "success": True,
        "message": message,
        "data": data if data is not None else {},
    }
    return Response(payload, status=http_status)


def error_response(message: str = "Error", errors=None, http_status: int = status.HTTP_400_BAD_REQUEST) -> Response:
    """Return a standardised error response."""
    payload = {
        "success": False,
        "message": message,
        "errors": errors if errors is not None else {},
    }
    return Response(payload, status=http_status)


def created_response(message: str = "Created successfully", data=None) -> Response:
    """Convenience wrapper for 201 Created."""
    return success_response(message=message, data=data, http_status=status.HTTP_201_CREATED)
