from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from app.core.config import settings

_request = google_requests.Request()


def verify_firebase_id_token(token: str) -> dict:
    """Verifies a Firebase Auth ID token against Google's public certs.

    No service-account secret needed — signature, issuer and audience are
    checked directly against the Firebase project id, same guarantee the
    Firebase Admin SDK gives for authentication purposes.
    """
    return google_id_token.verify_firebase_token(
        token, _request, audience=settings.firebase_project_id
    )
