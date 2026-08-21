from sqlalchemy.orm import Session
from app.models.bookmark import Bookmark
from app.models.video import Video
import os


# ==========================================
# Add Bookmark
# ==========================================

def add_bookmark(
    db: Session,
    user_id: int,
    video_id: int
):

    video = (
        db.query(Video)
        .filter(Video.id == video_id)
        .first()
    )

    if not video:
        return {
            "success": False,
            "message": "Video not found"
        }

    existing = (
        db.query(Bookmark)
        .filter(
            Bookmark.user_id == user_id,
            Bookmark.video_id == video_id
        )
        .first()
    )

    if existing:
        return {
            "success": False,
            "message": "Already bookmarked"
        }

    bookmark = Bookmark(
        user_id=user_id,
        video_id=video_id
    )

    db.add(bookmark)
    db.commit()
    db.refresh(bookmark)

    return {
        "success": True,
        "message": "Bookmark added successfully",
        "bookmark": {
            "id": bookmark.id,
            "user_id": bookmark.user_id,
            "video_id": bookmark.video_id
        }
    }


# ==========================================
# Remove Bookmark
# ==========================================

def remove_bookmark(
    db: Session,
    user_id: int,
    video_id: int
):

    bookmark = (
        db.query(Bookmark)
        .filter(
            Bookmark.user_id == user_id,
            Bookmark.video_id == video_id
        )
        .first()
    )

    if not bookmark:
        return {
            "success": False,
            "message": "Bookmark not found"
        }

    db.delete(bookmark)
    db.commit()

    return {
        "success": True,
        "message": "Bookmark removed successfully"
    }


# ==========================================
# User Bookmarks
# ==========================================

def get_user_bookmarks(
    db: Session,
    user_id: int
):

    bookmarks = (
        db.query(Bookmark)
        .filter(Bookmark.user_id == user_id)
        .order_by(Bookmark.id.desc())
        .all()
    )

    result = []

    for bookmark in bookmarks:

        video = (
            db.query(Video)
            .filter(Video.id == bookmark.video_id)
            .first()
        )

        if not video:
            continue

        # Convert Windows path to API path
        thumbnail = None

        if video.thumbnail_path:
            filename = os.path.basename(
                video.thumbnail_path.replace("\\", "/")
            )
            thumbnail = f"uploads/thumbnails/{filename}"

        # Convert video path
        video_path = None

        if hasattr(video, "video_path") and video.video_path:
            filename = os.path.basename(
                video.video_path.replace("\\", "/")
            )
            video_path = f"uploads/videos/{filename}"

        result.append({

            "bookmark_id": bookmark.id,

            "video_id": video.id,

            "title": video.title,

            "thumbnail": thumbnail,

            "video_path": video_path,

            "duration": video.duration,

            "status": video.status,

            "created_at": video.created_at

        })

    return result


# ==========================================
# Bookmark Status
# ==========================================

def is_bookmarked(
    db: Session,
    user_id: int,
    video_id: int
):

    bookmark = (
        db.query(Bookmark)
        .filter(
            Bookmark.user_id == user_id,
            Bookmark.video_id == video_id
        )
        .first()
    )

    return bookmark is not None