from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.auth.authorization import require_roles
from app.core.enums import UserRole, ActivityType

from app.schemas.bookmark import (
    BookmarkCreate,
    BookmarkResponse
)

from app.crud.bookmark import (
    get_existing_bookmark,
    create_bookmark,
    get_bookmarks_by_user,
    get_bookmark_by_id,
    delete_bookmark
)

from app.models.summary import Summary
from app.crud.video import get_available_video_by_id
from app.crud.summary import get_summary_by_type
from app.services.highlight_service import generate_highlight_report
from app.services.activity_service import log_activity

router = APIRouter(
    prefix="/bookmarks",
    tags=["Bookmarks"]
)


# ============================================================
# ADD BOOKMARK
# Learner only
# ============================================================

@router.post(
    "",
    response_model=BookmarkResponse,
    status_code=status.HTTP_201_CREATED
)
def add_bookmark(
    bookmark_data: BookmarkCreate,
    current_user=Depends(
        require_roles(UserRole.LEARNER)
    ),
    db: Session = Depends(get_db)
):

    content_type = bookmark_data.content_type.upper()

    # ---------------------------------------------------------
    # Validate SUMMARY bookmark
    # ---------------------------------------------------------

    if content_type == "SUMMARY":

        summary = (
        db.query(Summary)
        .filter(
            Summary.id == bookmark_data.content_id
        )
        .first()
    )

    if summary is None:
        raise HTTPException(
            status_code=404,
            detail="Summary not found"
        )

    # Only allow bookmarking valid summary types
    if summary.summary_type not in ["short", "detailed"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid summary type"
        )

    # ---------------------------------------------------------
    # Validate HIGHLIGHT bookmark
    #
    # Highlights are generated dynamically and do not have
    # their own database ID.
    #
    # Therefore content_id represents the associated video ID.
    # ---------------------------------------------------------

    elif content_type == "HIGHLIGHT":

        video = get_available_video_by_id(
            db=db,
            video_id=bookmark_data.content_id
        )

        if video is None:
            raise HTTPException(
                status_code=404,
                detail="Video not found or unavailable"
            )

    # ---------------------------------------------------------
    # Prevent duplicate bookmarks
    # ---------------------------------------------------------

    existing_bookmark = get_existing_bookmark(
    db=db,
    user_id=current_user.id,
    content_type=content_type,
    content_id=bookmark_data.content_id
    )

    if existing_bookmark is not None:
        raise HTTPException(
            status_code=400,
            detail="This content is already bookmarked"
        )

    # ---------------------------------------------------------
    # Create bookmark
    # ---------------------------------------------------------

    bookmark = create_bookmark(
    db=db,
    user_id=current_user.id,
    content_type=content_type,
    content_id=bookmark_data.content_id
    )

    # ---------------------------------------------------------
    # Log learner activity
    # ---------------------------------------------------------

    log_activity(
        db=db,
        user=current_user,
        activity_type=ActivityType.BOOKMARK_ADDED,
        entity_name=content_type
    )

    return bookmark


# ============================================================
# GET MY BOOKMARKS
# Learner only
# ============================================================

@router.get(
    "",
    response_model=List[BookmarkResponse]
)
def get_my_bookmarks(
    current_user=Depends(
        require_roles(UserRole.LEARNER)
    ),
    db: Session = Depends(get_db)
):

    bookmarks = get_bookmarks_by_user(
        db=db,
        user_id=current_user.id
    )

    bookmark_results = []

    for bookmark in bookmarks:

        # =====================================================
        # SUMMARY BOOKMARK
        # content_id = Summary ID
        # =====================================================

        if bookmark.content_type == "SUMMARY":

            summary = (
                db.query(Summary)
                .filter(
                    Summary.id == bookmark.content_id
                )
                .first()
            )

            if summary is None:
                continue

            video = get_available_video_by_id(
                db=db,
                video_id=summary.video_id
            )

            bookmark_results.append(
                {
                    "id": bookmark.id,
                    "user_id": bookmark.user_id,
                    "content_type": bookmark.content_type,
                    "content_id": bookmark.content_id,

                    "video_id": summary.video_id,

                    "video_filename": (
                        video.filename
                        if video else "Video unavailable"
                    ),

                    "summary_type": summary.summary_type,

                    "content_text": summary.summary_text,

                    "highlight_items": None,

                    "created_at": bookmark.created_at
                }
            )

        # =====================================================
        # HIGHLIGHT BOOKMARK
        # content_id = Video ID
        # =====================================================

        elif bookmark.content_type == "HIGHLIGHT":

            video = get_available_video_by_id(
                db=db,
                video_id=bookmark.content_id
            )

            if video is None:
                continue

            # Get short summary for generating highlights
            summary = get_summary_by_type(
                db=db,
                video=video,
                summary_type="SHORT"
            )

            highlight_items = []

            if summary is not None:

                report = generate_highlight_report(
                    video=video,
                    summary=summary,
                    key_moments=[]
                )

                highlight_items = report.get(
                    "highlights",
                    []
                )

            bookmark_results.append(
                {
                    "id": bookmark.id,
                    "user_id": bookmark.user_id,
                    "content_type": bookmark.content_type,

                    # For highlights this is the VIDEO ID
                    "content_id": bookmark.content_id,

                    "video_id": video.id,

                    "video_filename": video.filename,

                    "summary_type": None,

                    "content_text": (
                        "AI-generated highlights from this video."
                    ),

                    "highlight_items": highlight_items,

                    "created_at": bookmark.created_at
                }
            )

    return bookmark_results


# ============================================================
# REMOVE BOOKMARK
# Learner only
# ============================================================

@router.delete(
    "/{bookmark_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def remove_bookmark(
    bookmark_id: int,
    current_user=Depends(
        require_roles(UserRole.LEARNER)
    ),
    db: Session = Depends(get_db)
):

    bookmark = get_bookmark_by_id(
        db=db,
        bookmark_id=bookmark_id,
        user_id=current_user.id
    )

    if bookmark is None:
        raise HTTPException(
            status_code=404,
            detail="Bookmark not found"
        )

    content_type = bookmark.content_type

    delete_bookmark(
    db=db,
    bookmark=bookmark
    )

    log_activity(
    db=db,
    user=current_user,
    activity_type=ActivityType.BOOKMARK_REMOVED,
    entity_name=content_type
)

    return None