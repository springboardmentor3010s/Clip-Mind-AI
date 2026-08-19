"""
Health probe for containers and load balancers.

Reports database and cache reachability. Returns 503 when a dependency is down
so an orchestrator can hold traffic back until the stack is actually ready.
"""
from django.db import connection
from django.core.cache import cache
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
def health_check(request):
    checks = {}

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        checks["database"] = "ok"
    except Exception as exc:
        checks["database"] = f"error: {exc}"

    try:
        cache.set("__health__", "1", 10)
        checks["cache"] = "ok" if cache.get("__health__") == "1" else "error: readback failed"
    except Exception as exc:
        checks["cache"] = f"error: {exc}"

    healthy = all(v == "ok" for v in checks.values())
    return JsonResponse(
        {"status": "healthy" if healthy else "degraded", "checks": checks},
        status=200 if healthy else 503,
    )
