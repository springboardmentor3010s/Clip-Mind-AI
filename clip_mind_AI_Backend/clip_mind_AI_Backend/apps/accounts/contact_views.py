"""
Public contact endpoint.

The message is persisted BEFORE the email is attempted, so an SMTP outage
never loses an enquiry — administrators can still read it in the dashboard,
and `email_sent=False` flags that it was not delivered.
"""
import logging

from django.conf import settings
from django.core.mail import send_mail
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.parsers import JSONParser
from rest_framework.throttling import AnonRateThrottle

from core.responses import success_response, error_response, created_response
from core.logging_service import client_ip

from .models import ContactMessage
from .serializers import ContactMessageCreateSerializer

logger = logging.getLogger("api")


class ContactRateThrottle(AnonRateThrottle):
    """
    Tight per-IP limit — this endpoint is unauthenticated and sends email,
    so it is an obvious spam and mail-relay-abuse target.

    The rate comes from DEFAULT_THROTTLE_RATES["contact"] rather than a class
    attribute; hardcoding `rate` here would bypass the settings lookup and keep
    throttling active during tests.
    """
    scope = "contact"


class ContactView(APIView):
    """POST /api/v1/contact — submit a message from the public Contact page."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ContactRateThrottle]
    parser_classes = [JSONParser]

    def post(self, request):
        serializer = ContactMessageCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Please correct the errors below.", errors=serializer.errors)

        message = serializer.save(ip_address=client_ip(request))

        recipient = getattr(settings, "CONTACT_EMAIL", "") or settings.DEFAULT_FROM_EMAIL
        try:
            send_mail(
                subject=f"[ClipMind AI] {message.subject}",
                message=(
                    f"New message from the ClipMind AI contact form.\n\n"
                    f"Name:    {message.name}\n"
                    f"Email:   {message.email}\n"
                    f"Subject: {message.subject}\n\n"
                    f"{message.message}\n\n"
                    f"---\nReceived {message.created_at:%Y-%m-%d %H:%M} UTC from {message.ip_address}"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient],
                fail_silently=False,
            )
            message.email_sent = True
            message.save(update_fields=["email_sent"])
        except Exception as exc:
            # Persisted already — log and still report success to the sender.
            logger.error("Contact email delivery failed | id=%s | error=%s", message.id, exc)

        logger.info("Contact message received | id=%s | from=%s", message.id, message.email)
        return created_response(
            "Thanks — your message has been received. We'll get back to you shortly."
        )
