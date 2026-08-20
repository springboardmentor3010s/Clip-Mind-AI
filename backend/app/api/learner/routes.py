from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.postgres import get_db

from app.models.course import Course
from app.models.video import Video
from datetime import datetime
from app.models.bookmark import Bookmark
from app.models.learning_history import LearningHistory
from fastapi import HTTPException

from app.models.user import User
router = APIRouter(
    prefix="/learner",
    tags=["Learner"]
)


# =====================================================
# ALL COURSES
# =====================================================

@router.get("/courses")
def get_courses(
    db: Session = Depends(get_db)
):

    courses = (
        db.query(Course)
        .all()
    )

    data = []

    for course in courses:

        data.append({

            "id": course.id,

            "title": course.title,

            "description":
                course.description

        })

    return data


# =====================================================
# ALL AVAILABLE VIDEOS
# =====================================================

@router.get("/videos")
def get_all_videos(
    db: Session = Depends(get_db)
):

    videos = (
        db.query(Video)
        .filter(
            Video.status == "Completed"
        )
        .order_by(
            Video.uploaded_at.desc()
        )
        .all()
    )

    data = []

    for video in videos:

        data.append({

            "id": video.id,

            "title": video.title,

            "description":
                video.description,

            "category":
                video.category,

            "duration":
                video.duration,

            "thumbnail":
                video.thumbnail,

            "filename":
                video.filename,

            "views":
                video.views or 0,

            "status":
                video.status,

            "course_id":
                video.course_id,

            "uploaded_at":
                video.uploaded_at

        })

    return data


# =====================================================
# LEARNER DASHBOARD STATISTICS
# =====================================================

@router.get("/dashboard")
def get_learner_dashboard(
    db: Session = Depends(get_db)
):

    total_videos = (
        db.query(Video)
        .filter(
            Video.status == "Completed"
        )
        .count()
    )

    total_courses = (
        db.query(Course)
        .count()
    )

    return {

        "total_videos":
            total_videos,

        "total_courses":
            total_courses

    }
    
# =====================================================
# SAVE LEARNING PROGRESS
# =====================================================

@router.post("/history")
def save_learning_history(
    learner_id: int,
    video_id: int,
    current_time: float,
    duration: float,
    db: Session = Depends(get_db)
):

    if duration <= 0:

        progress = 0

    else:

        progress = (
            current_time / duration
        ) * 100

    progress = min(
        max(progress, 0),
        100
    )

    completed = progress >= 90

    history = (
        db.query(LearningHistory)
        .filter(
            LearningHistory.learner_id == learner_id,
            LearningHistory.video_id == video_id
        )
        .first()
    )

    if history:

        history.current_time = current_time

        history.progress = progress

        history.completed = completed

        history.last_watched = datetime.utcnow()

    else:

        history = LearningHistory(

            learner_id=learner_id,

            video_id=video_id,

            current_time=current_time,

            progress=progress,

            completed=completed,

            last_watched=datetime.utcnow()

        )

        db.add(history)

    db.commit()

    db.refresh(history)

    return {

        "message":
            "Learning progress saved",

        "progress":
            round(progress, 2),

        "completed":
            completed

    }


# =====================================================
# GET LEARNING HISTORY
# =====================================================

@router.get("/history")
def get_learning_history(
    learner_id: int,
    db: Session = Depends(get_db)
):

    history = (

        db.query(
            LearningHistory,
            Video
        )

        .join(
            Video,
            LearningHistory.video_id ==
            Video.id
        )

        .filter(
            LearningHistory.learner_id ==
            learner_id
        )

        .order_by(
            LearningHistory.last_watched.desc()
        )

        .all()

    )

    data = []

    for item, video in history:

        data.append({

            "id": item.id,

            "video_id":
                video.id,

            "title":
                video.title,

            "description":
                video.description,

            "duration":
                video.duration,

            "current_time":
                item.current_time,

            "progress":
                round(
                    item.progress or 0,
                    2
                ),

            "completed":
                item.completed,

            "last_watched":
                item.last_watched

        })

    return data

# =====================================================
# CREATE BOOKMARK
# =====================================================

@router.post("/bookmarks")
def create_bookmark(
    learner_id: int,
    video_id: int,
    bookmark_type: str,
    title: str = "",
    content: str = "",
    timestamp: float = None,
    db: Session = Depends(get_db)
):

    bookmark = Bookmark(

        learner_id=learner_id,

        video_id=video_id,

        bookmark_type=bookmark_type,

        title=title,

        content=content,

        timestamp=timestamp

    )

    db.add(bookmark)

    db.commit()

    db.refresh(bookmark)

    return {

        "message": "Bookmark saved",

        "bookmark": {

            "id": bookmark.id,

            "video_id": bookmark.video_id,

            "bookmark_type":
                bookmark.bookmark_type,

            "title":
                bookmark.title,

            "content":
                bookmark.content,

            "timestamp":
                bookmark.timestamp

        }

    }


# =====================================================
# GET LEARNER BOOKMARKS
# =====================================================

@router.get("/bookmarks")
def get_bookmarks(
    learner_id: int,
    db: Session = Depends(get_db)
):

    bookmarks = (

        db.query(
            Bookmark,
            Video
        )

        .join(
            Video,
            Bookmark.video_id == Video.id
        )

        .filter(
            Bookmark.learner_id == learner_id
        )

        .order_by(
            Bookmark.created_at.desc()
        )

        .all()

    )

    data = []

    for bookmark, video in bookmarks:

        data.append({

            "id": bookmark.id,

            "video_id": video.id,

            "video_title":
                video.title,

            "bookmark_type":
                bookmark.bookmark_type,

            "title":
                bookmark.title,

            "content":
                bookmark.content,

            "timestamp":
                bookmark.timestamp,

            "created_at":
                bookmark.created_at

        })

    return data


# =====================================================
# DELETE BOOKMARK
# =====================================================

@router.delete("/bookmarks/{bookmark_id}")
def delete_bookmark(
    bookmark_id: int,
    learner_id: int,
    db: Session = Depends(get_db)
):

    bookmark = (

        db.query(Bookmark)

        .filter(
            Bookmark.id == bookmark_id,
            Bookmark.learner_id == learner_id
        )

        .first()

    )

    if not bookmark:

        return {
            "message": "Bookmark not found"
        }

    db.delete(bookmark)

    db.commit()

    return {
        "message": "Bookmark deleted"
    }
    
# =====================================================
# LEARNER PROFILE
# =====================================================

@router.get("/profile/{user_id}")
def get_learner_profile(
    user_id: int,
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {

        "username":
            user.username,

        "email":
            user.email,

        "role":
            user.role,

        "member_since":
            user.created_at

    }
    
@router.put("/profile/{user_id}")
def update_learner_profile(
    user_id: int,
    username: str,
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    existing_user = (
        db.query(User)
        .filter(
            User.username == username,
            User.id != user_id
        )
        .first()
    )

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )

    user.username = username

    db.commit()

    db.refresh(user)

    return {

        "message":
            "Username updated successfully",

        "username":
            user.username

    }