# Make Celery app available when Django starts so @shared_task decorators work.
from .celery import app as celery_app

__all__ = ("celery_app",)
