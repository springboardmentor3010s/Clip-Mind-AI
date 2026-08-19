"""
Delete media files under MEDIA_ROOT/videos and MEDIA_ROOT/thumbnails that are
no longer referenced by any Video or KeyMoment record (e.g. originals left
behind by older processing runs).

Usage:
    python manage.py cleanup_orphan_media --dry-run   # list only
    python manage.py cleanup_orphan_media             # actually delete
"""
import os
import glob

from django.conf import settings
from django.core.management.base import BaseCommand

from apps.videos.models import Video
from apps.summaries.models import KeyMoment


class Command(BaseCommand):
    help = "Remove media files (videos + thumbnails) that have no DB reference."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run", action="store_true",
            help="List orphan files without deleting them.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]

        referenced = set()
        for video in Video.objects.exclude(video_file="").exclude(video_file__isnull=True):
            try:
                referenced.add(os.path.abspath(video.video_file.path))
            except Exception:
                pass
        for moment in KeyMoment.objects.exclude(thumbnail="").exclude(thumbnail__isnull=True):
            try:
                referenced.add(os.path.abspath(moment.thumbnail.path))
            except Exception:
                pass

        scanned = 0
        orphans = 0
        removed = 0
        for subdir in ("videos", "thumbnails"):
            base = os.path.join(settings.MEDIA_ROOT, subdir)
            for path in glob.glob(os.path.join(base, "*")):
                if not os.path.isfile(path):
                    continue
                scanned += 1
                if os.path.abspath(path) in referenced:
                    continue
                orphans += 1
                prefix = "[dry-run] would remove" if dry_run else "removing"
                self.stdout.write(f"{prefix}: {path}")
                if not dry_run:
                    try:
                        os.remove(path)
                        removed += 1
                    except OSError as exc:
                        self.stderr.write(f"  failed: {exc}")

        verb = "Would remove" if dry_run else "Removed"
        self.stdout.write(self.style.SUCCESS(
            f"Done. Scanned {scanned} file(s); {verb} {orphans if dry_run else removed} orphan file(s)."
        ))
