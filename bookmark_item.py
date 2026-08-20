"""
BookmarkItem model.

Lets users save individual pieces of content ("highlights") for later —
currently AI summaries and detected key-moment chapters. Unlike the
video-level `Bookmark`, this references a specific item within a video.

item_type values:
  - "summary"    -> item_id references summaries.id
  - "key_moment" -> item_id references key_moments.id
"""
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship
from app.database.database import Base

# Allowed item types (validated at the service layer).
VALID_BOOKMARK_ITEM_TYPES = ("summary", "key_moment")


class BookmarkItem(Base):
    __tablename__ = "bookmark_items"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # One of VALID_BOOKMARK_ITEM_TYPES
    item_type = Column(String(50), nullable=False)

    # Referenced row id (summaries.id / key_moments.id depending on item_type)
    item_id = Column(Integer, nullable=False)

    # Optional user-supplied short label / note for the saved item.
    label = Column(String(500), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id", "item_type", "item_id",
            name="uq_bookmark_item_user_type_ref",
        ),
    )

    user = relationship("User", back_populates="bookmark_items")

    def __repr__(self):
        return (
            f"<BookmarkItem(id={self.id}, user_id={self.user_id}, "
            f"item_type='{self.item_type}', item_id={self.item_id})>"
        )