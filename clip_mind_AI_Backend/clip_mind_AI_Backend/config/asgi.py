"""
ASGI config for ClipMind AI.

Real-time processing updates are delivered via REST polling of the
`/api/v1/videos/<id>/progress` endpoint, so no WebSocket/Channels layer is
required. This exposes the standard Django ASGI application.
"""
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

application = get_asgi_application()
