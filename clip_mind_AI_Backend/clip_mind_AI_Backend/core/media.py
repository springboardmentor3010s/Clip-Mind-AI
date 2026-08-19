"""
Range-capable media file serving.

Django's built-in `static.serve` returns the whole file (HTTP 200) even for a
`Range` request, which prevents the browser's <video> element from seeking to
an unbuffered position (playback restarts at 0:00). This view honours HTTP
Range requests (206 Partial Content + Accept-Ranges), enabling reliable seeking.

For local development / small deployments this is served by Django. In a large
production deployment, serve MEDIA_ROOT through nginx/S3/CloudFront instead.
"""
import os
import re
import mimetypes

from django.conf import settings
from django.core import signing
from django.http import FileResponse, HttpResponse, Http404, StreamingHttpResponse

_RANGE_RE = re.compile(r"bytes=(\d+)-(\d*)", re.IGNORECASE)
_CHUNK = 8192


MEDIA_TOKEN_SALT = "clipmind.media"
MEDIA_TOKEN_TTL = 60 * 60 * 12   # 12 hours


def sign_media_path(rel_path: str) -> str:
    """
    Mint a short-lived, path-bound access token for a private media file.

    A browser <video> element cannot attach an Authorization header, so the
    API hands out URLs carrying a signed token instead. The token is bound to
    the exact path, so it cannot be replayed against another user's file, and
    it expires after MEDIA_TOKEN_TTL.
    """
    signer = signing.TimestampSigner(salt=MEDIA_TOKEN_SALT)
    return signer.sign(rel_path.replace("\\", "/"))


def _token_authorizes(token: str, rel_path: str) -> bool:
    """True if `token` is a valid, unexpired signature over `rel_path`."""
    if not token:
        return False
    signer = signing.TimestampSigner(salt=MEDIA_TOKEN_SALT)
    try:
        signed_path = signer.unsign(token, max_age=MEDIA_TOKEN_TTL)
    except (signing.BadSignature, signing.SignatureExpired):
        return False
    return signed_path == rel_path.replace("\\", "/")


def _authorize_media(request, rel_path: str) -> bool:
    """
    Authorise access to a media file.

    Video files are private. Access is granted when EITHER
      - the URL carries a valid signed token for this exact path, OR
      - the requester is authenticated and is the owner / an admin / a share
        recipient, OR
      - the video is shared with a public link.

    Thumbnails and profile images are non-sensitive derivatives and stay open,
    which keeps the key-moments grid working without signing every image.
    """
    from apps.videos.models import Video
    from apps.videos.services import user_can_view_video

    normalized = rel_path.replace("\\", "/")
    if not normalized.startswith("videos/"):
        return True  # thumbnails/, profile/ etc.

    # 1) Signed URL — how the <video> element authenticates.
    if _token_authorizes(request.GET.get("t", ""), normalized):
        return True

    video = Video.objects.filter(video_file=normalized).select_related("user").first()
    if not video:
        return False

    # 2) Public share — lets the unauthenticated /shared/<token> page play.
    share = getattr(video, "share", None)
    if share and share.is_public:
        return True

    # 3) Session/JWT-authenticated owner, admin, or share recipient.
    user = _authenticated_user(request)
    if not user:
        return False
    return user_can_view_video(user, video)


def _authenticated_user(request):
    """
    Resolve the requesting user from a JWT bearer token or Django session.

    This is a plain Django view (not DRF), so JWT authentication is applied
    manually rather than by a DRF authentication class.
    """
    user = getattr(request, "user", None)
    if user is not None and user.is_authenticated:
        return user
    try:
        from rest_framework_simplejwt.authentication import JWTAuthentication

        result = JWTAuthentication().authenticate(request)
        if result:
            return result[0]
    except Exception:
        return None
    return None


def _file_iterator(path, start, length):
    with open(path, "rb") as f:
        f.seek(start)
        remaining = length
        while remaining > 0:
            chunk = f.read(min(_CHUNK, remaining))
            if not chunk:
                break
            remaining -= len(chunk)
            yield chunk


def serve_media(request, path):
    """Serve a file from MEDIA_ROOT with HTTP Range support."""
    media_root = os.path.abspath(settings.MEDIA_ROOT)
    full_path = os.path.abspath(os.path.join(media_root, path))

    # Prevent path traversal outside MEDIA_ROOT.
    if not full_path.startswith(media_root + os.sep) or not os.path.isfile(full_path):
        raise Http404("Media not found.")

    # Authorise before streaming any bytes. 404 (not 403) so the endpoint never
    # reveals which files exist.
    if not _authorize_media(request, path):
        raise Http404("Media not found.")

    size = os.path.getsize(full_path)
    content_type = mimetypes.guess_type(full_path)[0] or "application/octet-stream"
    range_header = request.headers.get("Range", "")
    match = _RANGE_RE.match(range_header)

    if match:
        start = int(match.group(1))
        end = int(match.group(2)) if match.group(2) else size - 1
        end = min(end, size - 1)
        if start > end or start >= size:
            resp = HttpResponse(status=416)
            resp["Content-Range"] = f"bytes */{size}"
            return resp
        length = end - start + 1
        resp = StreamingHttpResponse(
            _file_iterator(full_path, start, length),
            status=206,
            content_type=content_type,
        )
        resp["Content-Range"] = f"bytes {start}-{end}/{size}"
        resp["Content-Length"] = str(length)
        resp["Accept-Ranges"] = "bytes"
        return resp

    # No Range header — return the whole file but advertise range support.
    resp = FileResponse(open(full_path, "rb"), content_type=content_type)
    resp["Content-Length"] = str(size)
    resp["Accept-Ranges"] = "bytes"
    return resp
