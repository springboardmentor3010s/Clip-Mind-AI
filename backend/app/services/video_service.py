"""
Video Upload & Processing Module — business logic for saving, validating,
inspecting, and processing uploaded video files via FFmpeg.
"""
"""
Video Upload & Processing Module — business logic for saving, validating,
inspecting, and processing uploaded video files via FFmpeg.
"""
import subprocess
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.classroom import Classroom
from app.models.classroom_membership import ClassroomMembership
from app.models.classroom_video_share import ClassroomVideoShare
from app.models.video import Video, VideoStatus
from app.models.video_share import VideoShare
from app.models.user import User
from app.services.email_service import send_share_notification_email
from app.services.audit_service import log_action

ALLOWED_CONTENT_TYPES = {
    "video/mp4",
    "video/quicktime",  # .mov
    "video/x-msvideo",  # .avi
    "video/webm",
}

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".webm"}


def _validate_file(file: UploadFile, file_size_mb: float) -> None:
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported content type '{file.content_type}'.",
        )

    if file_size_mb > settings.MAX_UPLOAD_SIZE_MB:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large ({file_size_mb:.1f} MB). Max allowed: {settings.MAX_UPLOAD_SIZE_MB} MB.",
        )


def _get_duration_seconds(file_path: str) -> int | None:
    """Use ffprobe (bundled with FFmpeg) to read video duration."""
    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                file_path,
            ],
            capture_output=True, text=True, timeout=15,
        )
        return int(float(result.stdout.strip()))
    except Exception:
        return None


def _standardize_format(input_path: str, output_path: str) -> bool:
    """Video Format Standardization: transcode to a consistent H.264/AAC MP4."""
    try:
        subprocess.run(
            [
                "ffmpeg", "-y", "-i", input_path,
                "-c:v", "libx264", "-preset", "fast", "-crf", "23",
                "-c:a", "aac", "-b:a", "128k",
                output_path,
            ],
            capture_output=True, timeout=300, check=True,
        )
        return True
    except Exception:
        return False


def _extract_thumbnail(input_path: str, output_path: str, duration: int | None) -> bool:
    """Frame Extraction (Key Frames): grab one representative frame from the midpoint."""
    midpoint = str(duration // 2) if duration else "1"
    try:
        subprocess.run(
            [
                "ffmpeg", "-y", "-ss", midpoint, "-i", input_path,
                "-frames:v", "1", "-q:v", "2",
                output_path,
            ],
            capture_output=True, timeout=60, check=True,
        )
        return True
    except Exception:
        return False


def _extract_audio_with_noise_reduction(input_path: str, output_path: str) -> bool:
    """
    Audio Extraction + Noise Reduction: pull the audio track, apply an FFT-based
    denoise filter, and downsample to 16kHz mono (also the ideal input format
    for Whisper transcription in the next milestone).
    """
    try:
        subprocess.run(
            [
                "ffmpeg", "-y", "-i", input_path,
                "-vn",                      # no video
                "-af", "afftdn",             # noise reduction filter
                "-ar", "16000", "-ac", "1",  # 16kHz mono
                output_path,
            ],
            capture_output=True, timeout=300, check=True,
        )
        return True
    except Exception:
        return False


def process_video(video: Video) -> None:
    """
    Runs the Video Processing Module pipeline on an already-uploaded video:
    format standardization, key-frame thumbnail extraction, and audio
    extraction with noise reduction. Mutates the given Video object's fields
    in place; caller is responsible for committing to the DB.
    """
    input_path = video.file_path
    base_dir = Path(input_path).parent
    stem = Path(video.stored_filename).stem

    processed_path = base_dir / f"{stem}_standardized.mp4"
    thumbnail_path = base_dir / f"{stem}_thumb.jpg"
    audio_path = base_dir / f"{stem}_audio.wav"

    standardized_ok = _standardize_format(input_path, str(processed_path))
    thumbnail_ok = _extract_thumbnail(input_path, str(thumbnail_path), video.duration_seconds)
    audio_ok = _extract_audio_with_noise_reduction(input_path, str(audio_path))

    if standardized_ok:
        video.processed_path = str(processed_path)
    if thumbnail_ok:
        video.thumbnail_path = str(thumbnail_path)
    if audio_ok:
        video.audio_path = str(audio_path)

    # Audio extraction is the critical step for the next milestone (transcription),
    # so treat its failure as a pipeline failure even if other steps succeeded.
    video.status = VideoStatus.READY if audio_ok else VideoStatus.FAILED


def save_uploaded_video(
    db: Session,
    file: UploadFile,
    owner: User,
    title: str,
    description: str | None = None,
) -> Video:
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    contents = file.file.read()
    file_size_mb = len(contents) / (1024 * 1024)

    _validate_file(file, file_size_mb)

    ext = Path(file.filename).suffix.lower()
    stored_filename = f"{uuid.uuid4()}{ext}"
    file_path = upload_dir / stored_filename

    with open(file_path, "wb") as f:
        f.write(contents)

    duration = _get_duration_seconds(str(file_path))

    video = Video(
        owner_id=owner.id,
        filename=file.filename,
        title=title,
        description=description,
        stored_filename=stored_filename,
        file_path=str(file_path),
        file_size_mb=round(file_size_mb, 2),
        content_type=file.content_type,
        duration_seconds=duration,
        status=VideoStatus.PROCESSING,
    )
    db.add(video)
    db.commit()
    db.refresh(video)

    process_video(video)
    db.commit()
    db.refresh(video)

    return video


def list_user_videos(db: Session, owner: User) -> list[Video]:
    return db.query(Video).filter(Video.owner_id == owner.id).order_by(Video.created_at.desc()).all()


def get_video_or_404(db: Session, video_id: uuid.UUID, owner: User, require_owner: bool = True) -> Video:
    """
    require_owner=True (default): only the video's owner may access it —
    used for every mutating action (generate/edit transcript, generate
    summary/key-moments, publish, delete).

    require_owner=False: also allow read-only access if the video has been
    published by its owner, shared directly with this user, OR shared with
    a classroom this user is enrolled in — used for the endpoints a Learner
    needs to view a shared video (details, stream, transcript/summary/
    key-moments reads, bookmarking, watch-progress pings).
    """
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found.")

    is_owner = video.owner_id == owner.id
    if is_owner or (not require_owner and video.is_published):
        return video

    if not require_owner:
        shared = (
            db.query(VideoShare)
            .filter(VideoShare.video_id == video_id, VideoShare.shared_with_user_id == owner.id)
            .first()
        )
        if shared:
            return video

        classroom_shared = (
            db.query(ClassroomVideoShare)
            .join(ClassroomMembership, ClassroomMembership.classroom_id == ClassroomVideoShare.classroom_id)
            .filter(ClassroomVideoShare.video_id == video_id, ClassroomMembership.student_id == owner.id)
            .first()
        )
        if classroom_shared:
            return video

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found.")


def list_published_videos(db: Session) -> list[Video]:
    """Content Library: every published video, from every user, newest first."""
    rows = (
        db.query(Video, User.full_name)
        .join(User, User.id == Video.owner_id)
        .filter(Video.is_published == True)  # noqa: E712
        .order_by(Video.created_at.desc())
        .all()
    )
    videos = []
    for video, owner_name in rows:
        video.owner_name = owner_name
        videos.append(video)
    return videos


def list_all_videos(db: Session) -> list[Video]:
    """Admin-only: every video on the platform, from every user, newest first."""
    rows = (
        db.query(Video, User.full_name)
        .join(User, User.id == Video.owner_id)
        .order_by(Video.created_at.desc())
        .all()
    )
    videos = []
    for video, owner_name in rows:
        video.owner_name = owner_name
        videos.append(video)
    return videos


def get_video_or_404_any(db: Session, video_id: uuid.UUID) -> Video:
    """Admin-only helper: fetch any video regardless of owner, or 404."""
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found.")
    return video


def set_video_published(db: Session, video_id: uuid.UUID, owner: User, is_published: bool) -> Video:
    """Owner-only: publish/unpublish a video to the shared content library."""
    video = get_video_or_404(db, video_id, owner)
    video.is_published = is_published
    db.commit()
    db.refresh(video)
    log_action(
        db,
        actor_id=owner.id,
        action="video.published" if is_published else "video.unpublished",
        target_type="video",
        target_id=video.id,
        detail=video.title or video.filename,
    )
    return video


def _share_to_dict(share: VideoShare, user: User) -> dict:
    return {
        "id": share.id,
        "video_id": share.video_id,
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "created_at": share.created_at,
    }


def share_video(db: Session, video_id: uuid.UUID, owner: User, emails: list[str]) -> dict:
    """
    Owner-only: share a video with specific people by email. Skips emails
    that don't match a registered account (returned as `not_found`) and
    emails already shared with (idempotent — no duplicate rows/errors).
    """
    video = get_video_or_404(db, video_id, owner)

    shared: list[dict] = []
    not_found: list[str] = []

    for raw_email in emails:
        email = raw_email.strip().lower()
        recipient = db.query(User).filter(User.email == email).first()

        if not recipient:
            not_found.append(raw_email)
            continue
        if recipient.id == owner.id:
            continue  # sharing with yourself is a no-op, not an error

        existing = (
            db.query(VideoShare)
            .filter(VideoShare.video_id == video.id, VideoShare.shared_with_user_id == recipient.id)
            .first()
        )
        if existing:
            shared.append(_share_to_dict(existing, recipient))
            continue

        share = VideoShare(video_id=video.id, shared_with_user_id=recipient.id, shared_by_user_id=owner.id)
        db.add(share)
        db.commit()
        db.refresh(share)
        shared.append(_share_to_dict(share, recipient))

        video_link = f"{settings.FRONTEND_URL}/dashboard/videos/{video.id}"
        send_share_notification_email(
            recipient.email,
            shared_by_name=owner.full_name,
            video_title=video.title or video.filename,
            video_link=video_link,
        )
        log_action(
            db,
            actor_id=owner.id,
            action="video.shared",
            target_type="video",
            target_id=video.id,
            detail=f"{video.title or video.filename} -> {recipient.email}",
        )

    return {"shared": shared, "not_found": not_found}


def get_video_shares(db: Session, video_id: uuid.UUID, owner: User) -> list[dict]:
    """Owner-only: list everyone a video is currently shared with."""
    get_video_or_404(db, video_id, owner)
    rows = (
        db.query(VideoShare, User)
        .join(User, User.id == VideoShare.shared_with_user_id)
        .filter(VideoShare.video_id == video_id)
        .order_by(VideoShare.created_at.desc())
        .all()
    )
    return [_share_to_dict(share, user) for share, user in rows]


def revoke_share(db: Session, video_id: uuid.UUID, owner: User, share_id: uuid.UUID) -> None:
    """Owner-only: revoke a previously granted share."""
    get_video_or_404(db, video_id, owner)
    share = (
        db.query(VideoShare)
        .filter(VideoShare.id == share_id, VideoShare.video_id == video_id)
        .first()
    )
    if not share:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Share not found.")
    db.delete(share)
    db.commit()


def _classroom_share_to_dict(share: ClassroomVideoShare, classroom: Classroom, student_count: int) -> dict:
    return {
        "id": share.id,
        "video_id": share.video_id,
        "classroom_id": share.classroom_id,
        "classroom_name": classroom.name,
        "student_count": student_count,
        "shared_by_user_id": share.shared_by_user_id,
        "created_at": share.created_at,
    }


def share_video_with_classroom(db: Session, video_id: uuid.UUID, owner: User, classroom_id: uuid.UUID) -> dict:
    """
    Owner-only: share a video with an entire classroom in one shot. The
    classroom must belong to the sharer — an educator can only share into
    their own classrooms, never someone else's. Idempotent: re-sharing
    with the same classroom returns the existing share rather than erroring.
    """
    video = get_video_or_404(db, video_id, owner)

    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found.")
    if classroom.educator_id != owner.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only share into your own classrooms.")

    student_count = db.query(ClassroomMembership).filter(ClassroomMembership.classroom_id == classroom_id).count()

    existing = (
        db.query(ClassroomVideoShare)
        .filter(ClassroomVideoShare.video_id == video.id, ClassroomVideoShare.classroom_id == classroom_id)
        .first()
    )
    if existing:
        return _classroom_share_to_dict(existing, classroom, student_count)

    share = ClassroomVideoShare(video_id=video.id, classroom_id=classroom_id, shared_by_user_id=owner.id)
    db.add(share)
    db.commit()
    db.refresh(share)

    log_action(
        db,
        actor_id=owner.id,
        action="video.shared_with_classroom",
        target_type="video",
        target_id=video.id,
        detail=f"{video.title or video.filename} -> classroom {classroom.name}",
    )

    return _classroom_share_to_dict(share, classroom, student_count)


def list_video_classroom_shares(db: Session, video_id: uuid.UUID, owner: User) -> list[dict]:
    """Owner-only: list every classroom a video is currently shared with."""
    get_video_or_404(db, video_id, owner)
    rows = (
        db.query(ClassroomVideoShare, Classroom)
        .join(Classroom, Classroom.id == ClassroomVideoShare.classroom_id)
        .filter(ClassroomVideoShare.video_id == video_id)
        .order_by(ClassroomVideoShare.created_at.desc())
        .all()
    )
    return [
        _classroom_share_to_dict(
            share,
            classroom,
            db.query(ClassroomMembership).filter(ClassroomMembership.classroom_id == classroom.id).count(),
        )
        for share, classroom in rows
    ]


def revoke_classroom_share(db: Session, video_id: uuid.UUID, owner: User, share_id: uuid.UUID) -> None:
    """Owner-only: revoke a video's share with a classroom."""
    get_video_or_404(db, video_id, owner)
    share = (
        db.query(ClassroomVideoShare)
        .filter(ClassroomVideoShare.id == share_id, ClassroomVideoShare.video_id == video_id)
        .first()
    )
    if not share:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom share not found.")
    db.delete(share)
    db.commit()


def list_shared_with_me(db: Session, user: User) -> list[Video]:
    """
    Shared with Me: every video explicitly shared with the current user
    directly, OR shared with a classroom they're enrolled in. Newest first,
    deduplicated (a video shared both ways only appears once).
    """
    direct_rows = (
        db.query(Video, User.full_name, VideoShare.created_at)
        .join(VideoShare, VideoShare.video_id == Video.id)
        .join(User, User.id == Video.owner_id)
        .filter(VideoShare.shared_with_user_id == user.id)
        .all()
    )
    classroom_rows = (
        db.query(Video, User.full_name, ClassroomVideoShare.created_at)
        .join(ClassroomVideoShare, ClassroomVideoShare.video_id == Video.id)
        .join(ClassroomMembership, ClassroomMembership.classroom_id == ClassroomVideoShare.classroom_id)
        .join(User, User.id == Video.owner_id)
        .filter(ClassroomMembership.student_id == user.id)
        .all()
    )

    seen: dict[uuid.UUID, tuple] = {}
    for video, owner_name, shared_at in [*direct_rows, *classroom_rows]:
        existing = seen.get(video.id)
        if not existing or shared_at > existing[2]:
            seen[video.id] = (video, owner_name, shared_at)

    ordered = sorted(seen.values(), key=lambda row: row[2], reverse=True)

    videos = []
    for video, owner_name, _shared_at in ordered:
        video.owner_name = owner_name
        videos.append(video)
    return videos


def delete_video_files_and_row(db: Session, video: Video) -> None:
    """
    Removes the video's files from disk (original upload, standardized copy,
    thumbnail, extracted audio) and deletes its Postgres row. Missing files
    are silently skipped — a partially-processed video may not have all of
    them. Caller is responsible for removing any associated Mongo documents
    (transcript/summary/key-moments) separately.
    """
    for path_str in (video.file_path, video.processed_path, video.thumbnail_path, video.audio_path):
        if not path_str:
            continue
        try:
            Path(path_str).unlink(missing_ok=True)
        except OSError:
            pass

    db.delete(video)
    db.commit()