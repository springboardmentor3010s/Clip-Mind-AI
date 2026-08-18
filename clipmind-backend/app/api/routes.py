from typing import List

from app.schemas.transcript_segment import TranscriptSegmentResponse
from app.crud.transcript_segment import get_transcript_segments_by_video

from app.schemas.video import VideoResponse
from app.crud.transcript import get_transcript_by_video
from app.crud.summary import (
    get_summary_by_video,
    get_summary_by_type
)

from app.schemas.summary import SummaryResponse
from app.schemas.transcript import TranscriptResponse
from app.services.upload_service import (
    save_uploaded_video,
    process_video_in_background
)
from app.crud.activity_history import get_user_activities
from app.services.activity_service import log_activity
from app.core.enums import ActivityType
from app.auth.authorization import require_roles
from app.core.enums import UserRole
# import os

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    UploadFile
)
from fastapi.responses import Response

from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database.connection import get_db

from app.schemas.user import (
    UserCreate,
    UserUpdate
)

from app.crud.user import (
    create_user,
    get_user_by_email,
    get_user_by_username,
    authenticate_user,
    update_user_profile
)

from app.crud.video import (
    get_user_videos,
    get_all_available_videos,
    get_video_by_id,
    get_available_video_by_id
)


from app.auth.jwt_handler import create_access_token
from app.auth.oauth2 import get_current_user


router = APIRouter()


@router.get("/")
async def home():
    return {
        "message": "Welcome to ClipMind AI Backend",
        "status": "Running"
    }


@router.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "ClipMind AI Backend"
    }


@router.post("/register")
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):

    existing_user = get_user_by_email(
        db,
        user.email
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    existing_username = get_user_by_username(
    db,
    user.username
    )

    if existing_username:
        raise HTTPException(
            status_code=400,
            detail="Username already registered"
    )

    new_user = create_user(
        db=db,
        username=user.username,
        full_name=user.full_name,
        email=user.email,
        password=user.password,
        role=user.role
    )

    log_activity(
        db=db,
        user=new_user,
        activity_type=ActivityType.REGISTER
    )


    return {
        "message": "User created successfully",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "full_name": new_user.full_name,
            "email": new_user.email,
            "role": new_user.role,
            "is_active": new_user.is_active
        }
    }


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    authenticated_user = authenticate_user(
        db,
        form_data.username,
        form_data.password
    )

    if not authenticated_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        data={
            "sub": authenticated_user.email
        }
    )

    log_activity(
        db=db,
        user=authenticated_user,
        activity_type=ActivityType.LOGIN
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/me")
def read_current_user(
    current_user=Depends(get_current_user)
):
    return {
    "message": "Protected route accessed successfully",
    "user": {
        "id": current_user.id,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "is_active": current_user.is_active
    }
}

@router.get("/profile")
def get_profile(
    current_user=Depends(get_current_user)
):

    return {
        "id": current_user.id,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at
    }

@router.put("/profile")
def update_profile(
    user_data: UserUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    updated_user = update_user_profile(
        db=db,
        user=current_user,
        username=user_data.username,
        full_name=user_data.full_name
    )

    log_activity(
        db=db,
        user=updated_user,
        activity_type=ActivityType.PROFILE_UPDATED
    )

    return {
        "message": "Profile updated successfully",
        "user": {
            "id": updated_user.id,
            "username": updated_user.username,
            "full_name": updated_user.full_name,
            "email": updated_user.email,
            "role": updated_user.role,
            "is_active": updated_user.is_active
        }
    }

@router.get("/activity-history")
def get_activity_history(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    activities = get_user_activities(
        db=db,
        user=current_user
    )

    return activities



@router.post("/upload")
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user=Depends(
        require_roles(
            UserRole.CONTENT_CREATOR,
            UserRole.EDUCATOR,
            UserRole.ADMIN
        )
    ),
    db: Session = Depends(get_db)
):

    # Save the video and create the database record
    video = save_uploaded_video(
        db=db,
        file=file,
        current_user=current_user,
    )

    # Start AI processing in the background
    background_tasks.add_task(
        process_video_in_background,
        video.id
    )

    # Log upload activity
    log_activity(
        db=db,
        user=current_user,
        activity_type=ActivityType.VIDEO_UPLOADED,
        entity_name=video.filename
    )

    return {
        "message": "Video uploaded successfully. AI processing has started.",
        "video": {
            "id": video.id,
            "filename": video.filename,
            "status": video.status
        }
    }

@router.get("/videos")
def get_videos(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # ---------------------------------------------------------
    # Learners can browse all available completed videos
    # ---------------------------------------------------------
    if current_user.role == UserRole.LEARNER:
        return get_all_available_videos(db=db)

    # ---------------------------------------------------------
    # Content Creators and Educators manage/view
    # their own uploaded videos
    # ---------------------------------------------------------
    if current_user.role in [
        UserRole.CONTENT_CREATOR,
        UserRole.EDUCATOR
    ]:
        return get_user_videos(
            db=db,
            owner_id=current_user.id
        )

    # ---------------------------------------------------------
    # Admin can view all available videos
    # ---------------------------------------------------------
    if current_user.role == UserRole.ADMIN:
        return get_all_available_videos(db=db)

    raise HTTPException(
        status_code=403,
        detail="You do not have permission to access videos"
    )

@router.get("/videos/{video_id}")
def get_video(
    video_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # ---------------------------------------------------------
    # Learner can view any available completed video
    # ---------------------------------------------------------
    if current_user.role == UserRole.LEARNER:

        video = get_available_video_by_id(
            db=db,
            video_id=video_id
        )

    # ---------------------------------------------------------
    # Admin can view available videos
    # ---------------------------------------------------------
    elif current_user.role == UserRole.ADMIN:

        video = get_available_video_by_id(
            db=db,
            video_id=video_id
        )

    # ---------------------------------------------------------
    # Content Creator / Educator can access
    # their own videos
    # ---------------------------------------------------------
    else:

        video = get_video_by_id(
            db=db,
            video_id=video_id,
            owner_id=current_user.id
        )

    if video is None:
        raise HTTPException(
            status_code=404,
            detail="Video not found"
        )

    return video

@router.get(
    "/videos/{video_id}/transcript",
    response_model=TranscriptResponse
)
def get_video_transcript(
    video_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Learner and Admin can view any available video
    if current_user.role in [
        UserRole.LEARNER,
        UserRole.ADMIN
    ]:

        video = get_available_video_by_id(
            db=db,
            video_id=video_id
        )

    # Creator and Educator access their own videos
    else:

        video = get_video_by_id(
            db=db,
            video_id=video_id,
            owner_id=current_user.id
        )

    if video is None:
        raise HTTPException(
            status_code=404,
            detail="Video not found"
        )

    transcript = get_transcript_by_video(
        db=db,
        video=video
    )

    if transcript is None:
        raise HTTPException(
            status_code=404,
            detail="Transcript not found"
        )

    log_activity(
            db=db,
            user=current_user,
            activity_type=ActivityType.TRANSCRIPT_VIEWED,
            entity_name=video.filename
    )   

    return transcript

@router.get(
    "/videos/{video_id}/transcript/download"
)
def download_video_transcript(
    video_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # ---------------------------------------------------------
    # Learner/Admin can access available videos
    # ---------------------------------------------------------
    if current_user.role in [
        UserRole.LEARNER,
        UserRole.ADMIN
    ]:

        video = get_available_video_by_id(
            db=db,
            video_id=video_id
        )

    # ---------------------------------------------------------
    # Content Creator/Educator can access own videos
    # ---------------------------------------------------------
    else:

        video = get_video_by_id(
            db=db,
            video_id=video_id,
            owner_id=current_user.id
        )

    # ---------------------------------------------------------
    # Validate video
    # ---------------------------------------------------------
    if video is None:
        raise HTTPException(
            status_code=404,
            detail="Video not found"
        )

    # ---------------------------------------------------------
    # Get transcript
    # ---------------------------------------------------------
    transcript = get_transcript_by_video(
        db=db,
        video=video
    )

    if transcript is None:
        raise HTTPException(
            status_code=404,
            detail="Transcript not found"
        )

    # ---------------------------------------------------------
    # Log download activity
    # ---------------------------------------------------------
    log_activity(
        db=db,
        user=current_user,
        activity_type=ActivityType.TRANSCRIPT_DOWNLOADED,
        entity_name=video.filename
    )

    # ---------------------------------------------------------
    # Use a safe ASCII-only filename
    # This avoids Unicode errors from the original video filename
    # ---------------------------------------------------------
    filename = f"video_{video_id}_transcript.txt"

    # ---------------------------------------------------------
    # Return downloadable transcript
    # ---------------------------------------------------------
    return Response(
        content=transcript.transcript_text,
        media_type="text/plain",
        headers={
            "Content-Disposition":
                f'attachment; filename="{filename}"'
        }
    )

@router.get(
    "/videos/{video_id}/transcript/segments",
    response_model=List[TranscriptSegmentResponse]
)
def get_video_transcript_segments(
    video_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Learner/Admin can consume available content
    if current_user.role in [
        UserRole.LEARNER,
        UserRole.ADMIN
    ]:

        video = get_available_video_by_id(
            db=db,
            video_id=video_id
        )

    # Creator/Educator access their own content
    else:

        video = get_video_by_id(
            db=db,
            video_id=video_id,
            owner_id=current_user.id
        )

    if video is None:
        raise HTTPException(
            status_code=404,
            detail="Video not found"
        )

    segments = get_transcript_segments_by_video(
        db=db,
        video_id=video.id
    )

    log_activity(
        db=db,
        user=current_user,
        activity_type=ActivityType.TRANSCRIPT_SEGMENTS_VIEWED,
        entity_name=video.filename
    )

    return segments

@router.get(
    "/videos/{video_id}/summary",
    response_model=SummaryResponse
)
def get_video_summary(
    video_id: int,
    type: str = "short",
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Learner/Admin can view summaries of available videos
    if current_user.role in [
        UserRole.LEARNER,
        UserRole.ADMIN
    ]:

        video = get_available_video_by_id(
            db=db,
            video_id=video_id
        )

    # Creator/Educator access their own videos
    else:

        video = get_video_by_id(
            db=db,
            video_id=video_id,
            owner_id=current_user.id
        )

    if video is None:
        raise HTTPException(
            status_code=404,
            detail="Video not found"
        )

    summary = get_summary_by_type(
        db=db,
        video=video,
        summary_type=type
    )

    if summary is None:
        raise HTTPException(
            status_code=404,
            detail="Summary not found"
        )

    log_activity(
        db=db,
        user=current_user,
        activity_type=ActivityType.SUMMARY_VIEWED,
        entity_name=f"{type.title()} summary - {video.filename}"
    )

    return summary

@router.get(
    "/videos/{video_id}/summary/download"
)
def download_video_summary(
    video_id: int,
    type: str = "short",
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # ---------------------------------------------------------
    # Validate summary type
    # ---------------------------------------------------------
    if type not in ["short", "detailed"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid summary type. Use 'short' or 'detailed'."
        )

    # ---------------------------------------------------------
    # Learner/Admin can access available videos
    # ---------------------------------------------------------
    if current_user.role in [
        UserRole.LEARNER,
        UserRole.ADMIN
    ]:

        video = get_available_video_by_id(
            db=db,
            video_id=video_id
        )

    # ---------------------------------------------------------
    # Content Creator/Educator can access own videos
    # ---------------------------------------------------------
    else:

        video = get_video_by_id(
            db=db,
            video_id=video_id,
            owner_id=current_user.id
        )

    # ---------------------------------------------------------
    # Validate video
    # ---------------------------------------------------------
    if video is None:
        raise HTTPException(
            status_code=404,
            detail="Video not found"
        )

    # ---------------------------------------------------------
    # Get requested summary
    # ---------------------------------------------------------
    summary = get_summary_by_type(
        db=db,
        video=video,
        summary_type=type
    )

    if summary is None:
        raise HTTPException(
            status_code=404,
            detail=f"{type.title()} summary not found"
        )

    # ---------------------------------------------------------
    # Log download activity
    # ---------------------------------------------------------
    log_activity(
        db=db,
        user=current_user,
        activity_type=ActivityType.SUMMARY_DOWNLOADED,
        entity_name=f"{type.title()} summary - {video.filename}"
    )

    # ---------------------------------------------------------
    # Use a safe ASCII-only filename
    # ---------------------------------------------------------
    filename = f"video_{video_id}_{type}_summary.txt"

    # ---------------------------------------------------------
    # Return downloadable summary
    # ---------------------------------------------------------
    return Response(
        content=summary.summary_text,
        media_type="text/plain",
        headers={
            "Content-Disposition":
                f'attachment; filename="{filename}"'
        }
    )