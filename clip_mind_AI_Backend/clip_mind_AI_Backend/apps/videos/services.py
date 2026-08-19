"""
On-demand translation of a video's AI outputs (transcript + summary + key
moments) into a user-selected language.

The ORIGINAL transcript/summary/key-moment records are never modified. Each
translation is generated once and stored in the DB (`VideoTranslation`) so it
survives restarts and is shared across workers; Redis is a fast read-through
cache on top. Thumbnails (which are language-independent) are attached fresh on
every response, so stored translations remain host-independent.
"""
import json
import logging
import secrets

from django.core.cache import cache
from django.db.models import Q

from services.ai.provider_manager import get_ai_provider
from apps.videos.models import VideoTranslation, VideoShare, Video

logger = logging.getLogger("ai")

TRANSLATION_TTL = 60 * 60 * 24 * 7   # 7 days (Redis layer)
_SEGMENT_BATCH = 40                  # segments per LLM call (fits the 8000 TPM free tier)


def translation_cache_key(video_id, language: str) -> str:
    slug = language.strip().lower().replace(" ", "_")[:40]
    return f"translation:{video_id}:{slug}"


# --------------------------------------------------------------------------- #
# Generation
# --------------------------------------------------------------------------- #
def _generate_payload(video, language: str) -> dict:
    """Translate the original content into `language`. Returns a host-independent payload."""
    provider = get_ai_provider()

    # Transcript segments (translate text only; keep timestamps).
    transcript = getattr(video, "transcript", None)
    segments = (transcript.segments if transcript else []) or []
    texts = [s.get("text", "") for s in segments]
    translated_texts = []
    for i in range(0, len(texts), _SEGMENT_BATCH):
        batch = texts[i:i + _SEGMENT_BATCH]
        res = provider.translate_json({"items": batch}, language)
        items = res.get("items", batch)
        if not isinstance(items, list) or len(items) != len(batch):
            items = batch
        translated_texts.extend(items)
    translated_segments = [
        {"start": s.get("start", 0.0), "duration": s.get("duration", 0.0), "text": t}
        for s, t in zip(segments, translated_texts)
    ]

    # Summary sections + key-moment text (one combined call).
    summary = getattr(video, "summary", None)
    sections = {}
    if summary:
        try:
            sections = json.loads(summary.content)
        except (ValueError, TypeError):
            sections = {"detailed_summary": summary.content}

    key_moments = list(video.key_moments.all())
    km_payload = [{"title": k.title, "description": k.description} for k in key_moments]
    combined = provider.translate_json({"summary": sections, "key_moments": km_payload}, language)
    t_summary = combined.get("summary", sections)
    t_kms = combined.get("key_moments", km_payload)
    if not isinstance(t_kms, list) or len(t_kms) != len(key_moments):
        t_kms = km_payload

    translated_km = [
        {
            "title": tk.get("title", k.title),
            "description": tk.get("description", k.description),
            "timestamp_seconds": k.timestamp_seconds,
            "order": k.order,
        }
        for k, tk in zip(key_moments, t_kms)
    ]

    return {
        "transcript_segments": translated_segments,
        "summary": t_summary,
        "key_moments": translated_km,
    }


def _get_payload(video, language: str, force: bool = False) -> dict:
    """Redis → DB → generate. Persists to both DB and Redis."""
    key = translation_cache_key(video.id, language)

    if not force:
        cached = cache.get(key)
        if cached:
            return cached
        row = VideoTranslation.objects.filter(video=video, language=language).first()
        if row and row.payload:
            cache.set(key, row.payload, TRANSLATION_TTL)
            return row.payload

    payload = _generate_payload(video, language)
    VideoTranslation.objects.update_or_create(
        video=video, language=language, defaults={"payload": payload}
    )
    cache.set(key, payload, TRANSLATION_TTL)
    return payload


def _build_response(video, payload: dict, language: str, request=None) -> dict:
    """Attach live thumbnails/ids (language-independent) to the translated payload."""
    live = {k.order: k for k in video.key_moments.all()}
    key_moments = []
    for tk in payload.get("key_moments", []):
        order = tk.get("order", 0)
        lk = live.get(order)
        thumb = None
        if lk and lk.thumbnail:
            thumb = request.build_absolute_uri(lk.thumbnail.url) if request else lk.thumbnail.url
        key_moments.append({
            "id": str(lk.id) if lk else None,
            "title": tk.get("title", ""),
            "description": tk.get("description", ""),
            "timestamp_seconds": tk.get("timestamp_seconds", lk.timestamp_seconds if lk else 0.0),
            "order": order,
            "thumbnail_url": thumb,
        })
    return {
        "language": language,
        "transcript": {"segments": payload.get("transcript_segments", [])},
        "summary": payload.get("summary", {}),
        "key_moments": key_moments,
    }


def translate_video_content(video, language: str, request=None, force: bool = False) -> dict:
    """Return the video's outputs translated into `language` (DB-persisted, Redis-cached)."""
    payload = _get_payload(video, language, force)
    return _build_response(video, payload, language, request)


# --------------------------------------------------------------------------- #
# Visibility & sharing
# --------------------------------------------------------------------------- #
def _with_related(qs):
    """
    Attach every nested relation the VideoSerializer reads.

    Without this, serialising N videos issues 3N extra queries (transcript,
    summary, key_moments) — the N+1 that made the video list slow.
    """
    return qs.select_related("transcript", "summary", "share").prefetch_related("key_moments")


def visible_videos_qs(user):
    """
    Every video `user` is allowed to see, as a queryset.

    - Administrators see everything (content management).
    - Everyone else sees their own uploads PLUS anything shared with them:
      a share with no explicit recipients is open to all authenticated users,
      while a share listing recipients is restricted to those users.
    """
    base = Video.objects.all()
    if user.role == "admin":
        return _with_related(base)

    shared_to_all = Q(share__isnull=False, share__shared_with__isnull=True)
    shared_to_me = Q(share__shared_with=user)
    return _with_related(base.filter(Q(user=user) | shared_to_all | shared_to_me)).distinct()


def library_videos_qs(user):
    """
    The browsable library: completed videos shared with `user`, excluding their
    own uploads. This is what a Learner browses.
    """
    shared_to_all = Q(share__isnull=False, share__shared_with__isnull=True)
    shared_to_me = Q(share__shared_with=user)
    return (
        _with_related(
            Video.objects.filter(
                (shared_to_all | shared_to_me),
                status=Video.Status.COMPLETED,
            ).exclude(user=user)
        )
        .distinct()
    )


def user_can_view_video(user, video) -> bool:
    """True if `user` may read `video` (owner, admin, or a valid share)."""
    if user.role == "admin" or video.user_id == user.id:
        return True
    share = VideoShare.objects.filter(video=video).first()
    if not share:
        return False
    # No explicit recipients => shared with every authenticated user.
    if not share.shared_with.exists():
        return True
    return share.shared_with.filter(pk=user.pk).exists()


def create_share(video, owner, is_public=True, note="", recipients=None) -> VideoShare:
    """
    Create or update the share for `video`. Re-sharing keeps the existing token
    so links already handed out never break.
    """
    share, _created = VideoShare.objects.get_or_create(
        video=video,
        defaults={
            "owner": owner,
            "token": secrets.token_urlsafe(32),
            "is_public": is_public,
            "note": note,
        },
    )
    share.is_public = is_public
    share.note = note
    share.save(update_fields=["is_public", "note"])

    if recipients is not None:
        share.shared_with.set(recipients)
    return share
