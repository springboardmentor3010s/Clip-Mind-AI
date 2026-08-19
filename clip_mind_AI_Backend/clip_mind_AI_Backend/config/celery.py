"""
Celery application for ClipMind AI.

Memurai (Redis-compatible server for Windows) is used as the broker and result backend.
Memurai speaks the standard Redis protocol, so standard Redis URLs work unchanged.

Start the worker on Windows (prefork pool is not supported on Windows):
    celery -A config worker --pool=solo -l info

Start with beat scheduler (for periodic tasks):
    celery -A config worker --pool=solo -B -l info
"""
import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("clipmind_ai")

# Load Celery settings from Django settings using the CELERY_ namespace
app.config_from_object("django.conf:settings", namespace="CELERY")

# Auto-discover tasks.py in every app listed in INSTALLED_APPS
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Smoke-test task — verifies Celery worker is running."""
    print(f"Celery debug task | request={self.request!r}")
