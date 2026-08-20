"""
BookmarkItem service: manages saving individual content items
(AI summaries and key-moment chapters) for the current user.
"""
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.bookmark_item import VALID_BOOKMARK_ITEM_TYPES
from app.models.bookmark_item import BookmarkItem


class BookmarkItemService:
    """Service for content-item bookmarking."""

    @staticmethod
    def _validate_type(item_type: str) -> str:
        """Validate the requested item type."""
        if item_type not in VALID_BOOKMARK_ITEM_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"item_type must be one of: "
                    f"{', '.join(VALID_BOOKMARK_ITEM_TYPES)}"
                ),
            )
        return item_type

    @staticmethod
    def _get_item(db: Session, item_type: str, item_id: int):
        """Fetch and validate the referenced content row, returning
        (item, video) so the caller can build display details."""
        from app.models.key_moment import KeyMoment
        from app.models.summary import Summary
        from app.models.video import Video

        item = None
        video = None

        if item_type == "summary":
            item = db.query(Summary).filter(Summary.id == item_id).first()
        elif item_type == "key_moment":
            item = db.query(KeyMoment).filter(KeyMoment.id == item_id).first()

        if item is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"{item_type} item not found",
            )

        video = db.query(Video).filter(Video.id == item.video_id).first()
        return item, video

    @staticmethod
    def add(
        db: Session,
        user_id: int,
        item_type: str,
        item_id: int,
        label: Optional[str] = None,
    ) -> BookmarkItem:
        """Save a content item. Idempotent — returns the existing one."""
        item_type = BookmarkItemService._validate_type(item_type)
        BookmarkItemService._get_item(db, item_type, item_id)

        existing = (
            db.query(BookmarkItem)
            .filter(
                BookmarkItem.user_id == user_id,
                BookmarkItem.item_type == item_type,
                BookmarkItem.item_id == item_id,
            )
            .first()
        )
        if existing:
            if label and label != existing.label:
                existing.label = label
                db.add(existing)
                db.commit()
                db.refresh(existing)
            return existing

        saved = BookmarkItem(
            user_id=user_id,
            item_type=item_type,
            item_id=item_id,
            label=label,
        )
        db.add(saved)
        db.commit()
        db.refresh(saved)
        return saved

    @staticmethod
    def remove(db: Session, user_id: int, item_type: str, item_id: int) -> bool:
        """Remove a saved content item."""
        item_type = BookmarkItemService._validate_type(item_type)
        saved = (
            db.query(BookmarkItem)
            .filter(
                BookmarkItem.user_id == user_id,
                BookmarkItem.item_type == item_type,
                BookmarkItem.item_id == item_id,
            )
            .first()
        )
        if saved is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Saved item not found",
            )
        db.delete(saved)
        db.commit()
        return True

    @staticmethod
    def is_saved(db: Session, user_id: int, item_type: str, item_id: int) -> bool:
        """Check whether a content item is already saved by the user."""
        item_type = BookmarkItemService._validate_type(item_type)
        saved = (
            db.query(BookmarkItem)
            .filter(
                BookmarkItem.user_id == user_id,
                BookmarkItem.item_type == item_type,
                BookmarkItem.item_id == item_id,
            )
            .first()
        )
        return saved is not None

    @staticmethod
    def list_items(db: Session, user_id: int) -> List[dict]:
        """List all saved content items, newest first, enriched with the
        details needed to render them in the frontend."""
        saved_items = (
            db.query(BookmarkItem)
            .filter(BookmarkItem.user_id == user_id)
            .order_by(BookmarkItem.created_at.desc())
            .all()
        )

        results: List[dict] = []
        for saved in saved_items:
            try:
                item, video = BookmarkItemService._get_item(
                    db, saved.item_type, saved.item_id
                )
            except HTTPException:
                # Referenced item was deleted — skip it.
                continue

            if item is None or video is None:
                continue

            title = ""
            preview = ""
            link = f"/videos/{video.id}/summary"

            if saved.item_type == "summary":
                title = saved.label or "AI Summary"
                preview = (item.short_summary or "")[:220]
                link = f"/videos/{video.id}/summary"
            elif saved.item_type == "key_moment":
                title = item.title or "Key Moment"
                preview = item.description or ""
                minutes = int(item.start_time // 60)
                seconds = int(item.start_time % 60)
                stamp = f"{minutes}:{seconds:02d}"
                title = saved.label or f"{title} ({stamp})"
                link = f"/videos/{video.id}/key-moments"

            results.append({
                "id": saved.id,
                "item_type": saved.item_type,
                "item_id": saved.item_id,
                "label": saved.label,
                "created_at": saved.created_at,
                "video_id": video.id,
                "video_title": video.title,
                "video_thumbnail_url": video.thumbnail_url,
                "title": title,
                "preview": preview,
                "link": link,
            })

        return results