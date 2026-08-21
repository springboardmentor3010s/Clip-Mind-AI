import os
from fastapi.responses import FileResponse
from fastapi import (
    APIRouter,
    Depends,
    File,
    UploadFile,
    HTTPException,
    Form,
)
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (User, Video, Classroom,) 
from app.services.video_service import save_video
from app.schemas import (
    VideoResponse,
    TranscriptResponse,
    SummaryResponse,
    KeyMomentsResponse,
    ReportResponse, 
    KeywordsResponse,
    TopicsResponse 
)
from app.services.report_service import generate_report
from app.utils.role_guard import require_roles
from app.utils.video_access import get_accessible_video

router = APIRouter(
    prefix="/videos",
    tags=["Videos"]
)

class UpdateTranscriptRequest(BaseModel):
    transcript: str
    
@router.post(
    "/upload",
    response_model=VideoResponse
)
def upload_video(
    file: UploadFile = File(...),
    classroom_id: int | None = Form(None),
    current_user: User = Depends(
        require_roles(
            "creator",
            "educator",
            "admin"
        )
    ),
    db: Session = Depends(get_db),
):
    print("Filename:", file.filename)
    print("Content Type:", file.content_type)
    print("Classroom ID:", classroom_id)

    # =========================================
    # VALIDATE FILE TYPE
    # =========================================

    allowed_extensions = [
        ".mp4",
        ".avi",
        ".mov",
        ".mkv",
    ]

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file selected."
        )

    if not any(
        file.filename.lower().endswith(ext)
        for ext in allowed_extensions
    ):
        raise HTTPException(
            status_code=400,
            detail="Unsupported video format."
        )

    # =========================================
    # VALIDATE CLASSROOM
    # =========================================

    classroom = None

    if classroom_id is not None:

        classroom = (
            db.query(Classroom)
            .filter(
                Classroom.id == classroom_id
            )
            .first()
        )

        if classroom is None:
            raise HTTPException(
                status_code=404,
                detail="Classroom not found."
            )

        # Educator can upload only to
        # their own classroom.
        if (
            current_user.role == "educator"
            and classroom.created_by
            != current_user.id
        ):
            raise HTTPException(
                status_code=403,
                detail=(
                    "You can only upload lectures "
                    "to your own classrooms."
                )
            )

    # =========================================
    # SAVE VIDEO
    # =========================================

    video = save_video(
        db=db,
        file=file,
        user_id=current_user.id,
    )

    # =========================================
    # ASSIGN CLASSROOM
    # =========================================

    if classroom is not None:
        video.classroom_id = classroom.id

        db.commit()
        db.refresh(video)

    return video

@router.get(
    "/my-videos",
    response_model=list[VideoResponse]
)
def get_my_videos(
    current_user: User = Depends(
        require_roles("creator", "educator", "admin")
    ),
    db: Session = Depends(get_db),
):
    videos = (
        db.query(Video)
        .filter(Video.uploaded_by == current_user.id)
        .order_by(Video.id.desc())
        .all()
    )

    return videos

@router.get(
    "/available",
    response_model=list[VideoResponse]
)
def get_available_videos(
    current_user: User = Depends(
        require_roles(
            "creator",
            "learner",
            "educator",
            "admin"
        )
    ),
    db: Session = Depends(get_db),
):
    videos = (
        db.query(Video)
        .order_by(Video.id.desc())
        .all()
    )

    return videos

@router.get("/stats")
def get_video_stats(
    current_user: User = Depends(
        require_roles(
            "creator",
            "learner",
            "educator",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):
    if current_user.role == "learner":
        query = db.query(Video)
    else:
        query = db.query(Video).filter(
            Video.uploaded_by == current_user.id
        )

    videos = query.all()

    total_videos = len(videos)

    completed_videos = sum(
        1
        for video in videos
        if video.status and video.status.lower() == "completed"
    )

    processing_videos = sum(
        1
        for video in videos
        if video.status and video.status.lower() in [
            "uploaded",
            "processing",
        ]
    )

    failed_videos = sum(
        1
        for video in videos
        if video.status and video.status.lower() == "failed"
    )

    total_transcripts = sum(
        1
        for video in videos
        if video.transcript
    )

    total_summaries = sum(
        1
        for video in videos
        if video.summary
    )

    return {
        "total_videos": total_videos,
        "completed_videos": completed_videos,
        "processing_videos": processing_videos,
        "failed_videos": failed_videos,
        "total_transcripts": total_transcripts,
        "total_summaries": total_summaries,
    }

@router.put("/{video_id}/transcript")
def update_transcript(
    video_id: int,
    data: UpdateTranscriptRequest,
    current_user: User = Depends(
        require_roles("educator")
    ),
    db: Session = Depends(get_db),
):
    video = get_accessible_video(
        video_id,
        current_user,
        db
    )

    # Educator can edit only their own uploaded videos
    if video.uploaded_by != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only edit transcripts of your own videos."
        )

    transcript = data.transcript.strip()

    if not transcript:
        raise HTTPException(
            status_code=400,
            detail="Transcript cannot be empty."
        )

    video.transcript = transcript

    db.commit()
    db.refresh(video)

    return {
        "message": "Transcript updated successfully.",
        "transcript": video.transcript
    }

@router.get(
    "/{video_id}/transcript",
    response_model=TranscriptResponse
)
def get_transcript(
    video_id: int,
    current_user: User = Depends(
        require_roles(
            "creator",
            "learner",
            "educator",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):

    video = get_accessible_video(
    video_id,
    current_user,
    db
)

    return video

@router.get(
    "/{video_id}/summary",
    response_model=SummaryResponse
)
def get_summary(
    video_id: int,
    current_user: User = Depends(
        require_roles(
            "creator",
            "learner",
            "educator",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):

    video = get_accessible_video(
    video_id,
    current_user,
    db
)

    return video

@router.get(
    "/{video_id}/key-moments",
    response_model=KeyMomentsResponse
)
def get_key_moments(
    video_id: int,
    current_user: User = Depends(
        require_roles(
            "creator",
            "learner",
            "educator",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):

    video = get_accessible_video(
    video_id,
    current_user,
    db
)

    return {
        "key_moments": video.key_moments
    }

@router.get(
    "/{video_id}/report",
    response_model=ReportResponse
)
def get_report(
    video_id: int,
    current_user: User = Depends(
        require_roles(
            "creator",
            "learner",
            "educator",
            "admin"
        )
    ),
    db: Session = Depends(get_db),
):
    video = get_accessible_video(
       video_id,
       current_user,
       db)

    return generate_report(video)

@router.get(
    "/{video_id}/keywords",
    response_model=KeywordsResponse
)
def get_keywords(
    video_id: int,
    current_user: User = Depends(
        require_roles(
            "creator",
            "learner",
            "educator",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):

    video = get_accessible_video(
        video_id,
        current_user,
        db
    )

    return {
        "keywords": video.keywords or []
    }

@router.get(
    "/{video_id}/topics",
    response_model=TopicsResponse
)
def get_topics(
    video_id: int,
    current_user: User = Depends(
        require_roles(
            "creator",
            "learner",
            "educator",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):
    video = get_accessible_video(
    video_id,
    current_user,
    db
)

    return {
        "topics": video.topics
    }

@router.get("/{video_id}/highlight-report")
def get_highlight_report(
    video_id: int,
    current_user: User = Depends(
        require_roles(
            "creator",
            "learner",
            "educator",
            "admin"
        )
    ),
    db: Session = Depends(get_db),
):
    video = get_accessible_video(
    video_id,
    current_user,
    db
)

    return {
        "highlight_report": video.highlight_report
    }

@router.get(
    "/{video_id}",
    response_model=VideoResponse
)
def get_video(
    video_id: int,
    current_user: User = Depends(
        require_roles(
            "creator",
            "learner",
            "educator",
            "admin"
        )
    ),
    db: Session = Depends(get_db),
):
    video = get_accessible_video(
        video_id,
        current_user,
        db
    )

    return video

@router.get("/stream/{filename}")
def stream_video(filename: str):

    path = os.path.join("uploads", filename)

    if not os.path.exists(path):
        raise HTTPException(
            status_code=404,
            detail="Video not found"
        )

    return FileResponse(
        path=path,
        media_type="video/mp4",
        filename=filename,
    )

# -----------------------------------------
# GET VIDEOS FOR A CLASSROOM
# -----------------------------------------

@router.get("/classroom/{classroom_id}")
def get_classroom_videos(
    classroom_id: int,
    current_user: User = Depends(
        require_roles("learner")
    ),
    db: Session = Depends(get_db),
):
    # Check that classroom exists
    classroom = (
        db.query(Classroom)
        .filter(
            Classroom.id == classroom_id
        )
        .first()
    )

    if classroom is None:
        raise HTTPException(
            status_code=404,
            detail="Classroom not found."
        )

    # -----------------------------------------
    # CHECK LEARNER MEMBERSHIP
    # -----------------------------------------

    membership = (
        db.query(ClassroomMember)
        .filter(
            ClassroomMember.classroom_id
            == classroom_id,
            ClassroomMember.student_id
            == current_user.id
        )
        .first()
    )

    if membership is None:
        raise HTTPException(
            status_code=403,
            detail="You are not a member of this classroom."
        )

    # -----------------------------------------
    # GET CLASSROOM VIDEOS
    # -----------------------------------------

    videos = (
        db.query(Video)
        .filter(
            Video.classroom_id == classroom_id
        )
        .order_by(Video.id.desc())
        .all()
    )

    return [
        {
            "id": video.id,
            "filename": video.filename,
            "original_filename": video.original_filename,
            "status": video.status,
            "uploaded_by": video.uploaded_by,
            "classroom_id": video.classroom_id,
        }
        for video in videos
    ]