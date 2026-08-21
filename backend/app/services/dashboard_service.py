from sqlalchemy.orm import Session

from app.models.user import User
from app.models.role import Role
from app.models.video import Video
from app.models.bookmark import Bookmark

# ==========================================
# Admin Dashboard
# ==========================================
def get_admin_dashboard(db: Session):

    total_users = db.query(User).count()

    total_videos = db.query(Video).count()

    uploaded = db.query(Video).filter(
        Video.status == "Uploaded"
    ).count()

    processing = db.query(Video).filter(
        Video.status == "Processing"
    ).count()

    completed = db.query(Video).filter(
        Video.status == "Completed"
    ).count()

    admins = (
        db.query(User)
        .join(Role)
        .filter(Role.role_name == "admin")
        .count()
    )

    creators = (
        db.query(User)
        .join(Role)
        .filter(Role.role_name == "creator")
        .count()
    )

    educators = (
        db.query(User)
        .join(Role)
        .filter(Role.role_name == "educator")
        .count()
    )

    learners = (
        db.query(User)
        .join(Role)
        .filter(Role.role_name == "learner")
        .count()
    )

    return {
        "total_users": total_users,
        "total_videos": total_videos,
        "uploaded_videos": uploaded,
        "processing_jobs": processing,
        "completed_videos": completed,
        "admins": admins,
        "content_creators": creators,
        "educators": educators,
        "learners": learners,
        "storage_used": "0 GB"
    }


# ==========================================
# Creator Dashboard
# ==========================================
def get_creator_dashboard(db: Session):

    uploaded = db.query(Video).count()

    processing = db.query(Video).filter(
        Video.status == "Processing"
    ).count()

    completed = db.query(Video).filter(
        Video.status == "Completed"
    ).count()

    return {
        "uploaded_videos": uploaded,
        "processing_videos": processing,
        "processed_videos": completed,
        "ai_summaries": completed,
        "transcripts": completed
    }


# ==========================================
# Educator Dashboard
# ==========================================
def get_educator_dashboard(db: Session):

    total_videos = db.query(Video).count()

    completed = db.query(Video).filter(
        Video.status == "Completed"
    ).count()

    return {
        "total_courses": 0,
        "total_videos": total_videos,
        "total_students": 0,
        "ai_notes": completed
    }



# ==========================================
# Learner Dashboard
# ==========================================

# ==========================================
# Learner Dashboard
# ==========================================

from app.models.bookmark import Bookmark


def get_learner_dashboard(db: Session):

    # Only processed videos
    videos = (
        db.query(Video)
        .filter(Video.status == "Processed")
        .order_by(Video.created_at.desc())
        .all()
    )

    video_list = []

    for video in videos:

        video_list.append({

            "id": video.id,
            "title": video.title,
            "thumbnail": video.thumbnail_path,
            "duration": video.duration,
            "status": video.status,
            "progress": 0

        })

    # Dashboard Statistics
    total_videos = len(video_list)

    total_bookmarks = db.query(Bookmark).count()

    progress = 0

    if total_videos > 0:
        progress = round((total_bookmarks / total_videos) * 100)

    # Latest Bookmarks
    bookmark_list = []

    bookmarks = (
        db.query(Bookmark)
        .order_by(Bookmark.id.desc())
        .limit(5)
        .all()
    )

    for bookmark in bookmarks:

        video = (
            db.query(Video)
            .filter(Video.id == bookmark.video_id)
            .first()
        )

        if video:

            bookmark_list.append({

                "video_id": video.id,
                "title": video.title,
                "thumbnail": video.thumbnail_path,
                "duration": video.duration

            })

    # Progress Chart
    progress_chart = [

        {"week": "Week 1", "progress": 20},
        {"week": "Week 2", "progress": 40},
        {"week": "Week 3", "progress": 60},
        {"week": "Week 4", "progress": progress}

    ]

    # Weekly Activity
    activity_chart = [

        {"day": "Mon", "minutes": 25},
        {"day": "Tue", "minutes": 45},
        {"day": "Wed", "minutes": 35},
        {"day": "Thu", "minutes": 55},
        {"day": "Fri", "minutes": 40},
        {"day": "Sat", "minutes": 30},
        {"day": "Sun", "minutes": 20}

    ]

    return {

        "videosWatched": total_videos,

        "summariesRead": total_videos,

        "bookmarks": total_bookmarks,

        "progress": progress,

        "videos": video_list,

        "bookmarkList": bookmark_list,

        "progressChart": progress_chart,

        "activityChart": activity_chart

    }