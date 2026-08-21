from sqlalchemy.orm import Session
from sqlalchemy import or_, cast, String

from app.models.video import Video


def search_videos(
    db: Session,
    query: str = "",
    status: str = "",
    date: str = ""
):

    videos = db.query(Video)

    # ----------------------------------
    # Search
    # ----------------------------------

    if query:

        videos = videos.filter(

            or_(

                Video.title.ilike(f"%{query}%"),

                Video.transcript.ilike(f"%{query}%"),

                Video.summary.ilike(f"%{query}%"),

                cast(Video.keywords, String).ilike(f"%{query}%")

            )

        )

    # ----------------------------------
    # Status Filter
    # ----------------------------------

    if status:

        videos = videos.filter(
            Video.status == status
        )

    # ----------------------------------
    # Date Filter
    # ----------------------------------

    if date:

        videos = videos.filter(
            cast(Video.created_at, String).ilike(f"%{date}%")
        )

    videos = videos.order_by(
        Video.created_at.desc()
    )

    return [
        video.to_summary()
        for video in videos.all()
    ]