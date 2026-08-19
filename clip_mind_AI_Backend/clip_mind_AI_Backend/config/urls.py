"""
ClipMind AI — Root URL configuration.
All APIs are versioned under /api/v1/.
"""
from django.contrib import admin
from django.urls import path, re_path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

from core.media import serve_media
from core.health import health_check
from apps.accounts.contact_views import ContactView

urlpatterns = [
    # Django admin
    path("admin/", admin.site.urls),

    # API v1
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/videos/", include("apps.videos.urls")),
    path("api/v1/analytics/", include("apps.analytics.urls")),
    path("api/v1/admin/", include("apps.accounts.admin_urls")),

    # Public contact form (rate-limited, unauthenticated)
    path("api/v1/contact", ContactView.as_view(), name="contact"),

    # Container/load-balancer health probe
    path("health/", health_check, name="health"),

    # OpenAPI schema & docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),

    # Media — range-capable so <video> can seek (see core.media).
    re_path(r"^media/(?P<path>.*)$", serve_media, name="media"),
]
