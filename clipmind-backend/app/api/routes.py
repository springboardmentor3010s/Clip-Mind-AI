import time
from typing import List

from app.schemas.transcript_segment import TranscriptSegmentResponse
from app.crud.transcript_segment import get_transcript_segments_by_video

from app.schemas.video import VideoResponse
from app.crud.transcript import (
    get_transcript_by_video,
    update_transcript
)
from app.crud.summary import (
    create_summary,
    get_summary_by_video,
    get_summary_by_type,
    update_summary
)

from app.schemas.summary import SummaryResponse
from app.schemas.transcript import (
    TranscriptResponse,
    TranscriptUpdate
)

from app.schemas.summary_share import (
    SummaryShareCreate,
    SummaryShareResponse
)

from app.crud.summary_share import (
    create_summary_share,
    get_shared_summaries_for_learner
)


from app.models.summary import Summary
from app.models.video import Video
from app.models.classroom import Classroom
from app.models.summary_share import SummaryShare

from app.services.upload_service import (
    save_uploaded_video,
    process_video_in_background
)

from app.services.summarization_service import (
    generate_educational_summary,
    generate_learning_material
)

from app.crud.activity_history import get_user_activities
from app.services.activity_service import log_activity
from app.core.enums import (
    ActivityType,
    SummaryType,
    UserRole
)
from app.auth.authorization import require_roles
# import os

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
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

from app.crud.classroom import get_classroom_by_id_and_educator


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

    if user.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Admin accounts cannot be created through public registration"
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
    classroom_id: int | None = Form(None),
    current_user=Depends(
        require_roles(
            UserRole.CONTENT_CREATOR,
            UserRole.EDUCATOR,
            UserRole.ADMIN
        )
    ),
    db: Session = Depends(get_db)
):

        # ---------------------------------------------------------
    # Validate classroom selection
    # ---------------------------------------------------------

    if classroom_id is not None:

        # Only educators can assign videos to classrooms
        if current_user.role != UserRole.EDUCATOR:
            raise HTTPException(
                status_code=403,
                detail="Only educators can upload videos to classrooms"
            )

        classroom = get_classroom_by_id_and_educator(
            db=db,
            classroom_id=classroom_id,
            educator_id=current_user.id
        )

        if classroom is None:
            raise HTTPException(
                status_code=404,
                detail="Classroom not found or does not belong to you"
            )


    # Save the video and create the database record
    video = save_uploaded_video(
        db=db,
        file=file,
        current_user=current_user,
        classroom_id=classroom_id
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
            "status": video.status,
            "classroom_id": video.classroom_id
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

@router.put(
    "/videos/{video_id}/transcript",
    response_model=TranscriptResponse
)
def edit_video_transcript(
    video_id: int,
    transcript_data: TranscriptUpdate,
    current_user=Depends(
        require_roles(UserRole.EDUCATOR)
    ),
    db: Session = Depends(get_db)
):

    # ---------------------------------------------------------
    # Educator can edit only their own video
    # ---------------------------------------------------------

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

    # ---------------------------------------------------------
    # Get existing transcript
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
    # Update transcript
    # ---------------------------------------------------------

    updated_transcript = update_transcript(
        db=db,
        transcript=transcript,
        transcript_text=transcript_data.transcript_text
    )

    # ---------------------------------------------------------
    # Log activity
    # ---------------------------------------------------------

    log_activity(
        db=db,
        user=current_user,
        activity_type=ActivityType.TRANSCRIPT_UPDATED,
        entity_name=video.filename
    )

    return updated_transcript


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

# ============================================================
# GENERATE EDUCATIONAL SUMMARY
# Educator only
# ============================================================

@router.post(
    "/videos/{video_id}/summary/educational",
    response_model=SummaryResponse
)
def generate_video_educational_summary(
    video_id: int,
    current_user=Depends(
        require_roles(UserRole.EDUCATOR)
    ),
    db: Session = Depends(get_db)
):

    # ---------------------------------------------------------
    # Educator can generate summaries only for their own videos
    # ---------------------------------------------------------

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

    # ---------------------------------------------------------
    # Get the latest transcript
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
    # Generate educational summary
    # ---------------------------------------------------------

    start_time = time.time()

    summary_text = generate_educational_summary(
        transcript.transcript_text
    )

    processing_time = (
        f"{time.time() - start_time:.2f} sec"
    )

    # ---------------------------------------------------------
    # Check whether an educational summary already exists
    # ---------------------------------------------------------

    existing_summary = get_summary_by_type(
        db=db,
        video=video,
        summary_type=SummaryType.EDUCATIONAL.value
    )

    # ---------------------------------------------------------
    # Update existing summary
    # ---------------------------------------------------------

    if existing_summary is not None:

        summary = update_summary(
            db=db,
            summary=existing_summary,
            summary_text=summary_text,
            model_name="t5-small",
            processing_time=processing_time
        )

    # ---------------------------------------------------------
    # Create new summary
    # ---------------------------------------------------------

    else:

        summary = create_summary(
            db=db,
            video=video,
            summary_type=SummaryType.EDUCATIONAL.value,
            summary_text=summary_text,
            model_name="t5-small",
            processing_time=processing_time
        )

    # ---------------------------------------------------------
    # Log activity
    # ---------------------------------------------------------

    log_activity(
        db=db,
        user=current_user,
        activity_type=ActivityType.SUMMARY_GENERATED,
        entity_name=f"Educational summary - {video.filename}"
    )

    return summary


# ============================================================
# GENERATE LEARNING MATERIAL
# Educator only
# ============================================================

@router.post(
    "/videos/{video_id}/learning-material"
)
def generate_video_learning_material(
    video_id: int,
    current_user=Depends(
        require_roles(UserRole.EDUCATOR)
    ),
    db: Session = Depends(get_db)
):

    # ---------------------------------------------------------
    # Verify educator owns the video
    # ---------------------------------------------------------

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

    if not transcript.transcript_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Transcript is empty"
        )

    # ---------------------------------------------------------
    # Generate material
    # ---------------------------------------------------------

    try:

        generated_material = generate_learning_material(
            transcript.transcript_text
        )

    except Exception as error:

        print(
            "Learning material generation failed:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to generate learning material"
        )

    # ---------------------------------------------------------
    # Save or update
    # ---------------------------------------------------------

    from app.crud.learning_material import (
        get_learning_material_by_video,
        create_learning_material,
        update_learning_material
    )

    existing_material = get_learning_material_by_video(
        db=db,
        video_id=video.id
    )

    if existing_material:

        material = update_learning_material(
            db=db,
            material=existing_material,
            overview=generated_material["overview"],
            key_learning_points=
                generated_material["key_learning_points"],
            study_notes=generated_material["study_notes"]
        )

    else:

        material = create_learning_material(
            db=db,
            video_id=video.id,
            created_by=current_user.id,
            overview=generated_material["overview"],
            key_learning_points=
                generated_material["key_learning_points"],
            study_notes=generated_material["study_notes"]
        )

    # ---------------------------------------------------------
    # Activity
    # ---------------------------------------------------------

    log_activity(
        db=db,
        user=current_user,
        activity_type=ActivityType.SUMMARY_GENERATED,
        entity_name=
            f"Learning material - {video.filename}"
    )

    return {
        "id": material.id,
        "video_id": material.video_id,
        "video_filename": video.filename,
        "created_by": material.created_by,
        "material_type": "LEARNING_MATERIAL",
        "overview": material.overview,
        "key_learning_points":
            material.key_learning_points,
        "study_notes": material.study_notes,
        "created_at": material.created_at,
        "updated_at": material.updated_at
    }


# ============================================================
# GET ALL SUMMARIES FOR A VIDEO
# Educator can access summaries of their own video
# ============================================================

@router.get(
    "/videos/{video_id}/summaries",
    response_model=List[SummaryResponse]
)
def get_video_summaries(
    video_id: int,
    current_user=Depends(
        require_roles(UserRole.EDUCATOR)
    ),
    db: Session = Depends(get_db)
):

    # ---------------------------------------------------------
    # Get the educator's own video
    # ---------------------------------------------------------

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

    # ---------------------------------------------------------
    # Get all summaries for this video
    # ---------------------------------------------------------

    summaries = get_summary_by_video(
        db=db,
        video=video
    )

    return summaries


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

    if type not in [
        "short",
        "detailed",
        "educational"
    ]:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid summary type. "
                "Use 'short', 'detailed', or 'educational'."
            )
        )

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
    if type not in ["short", "detailed", "educational"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid summary type. Use 'short', 'detailed', or 'educational'."
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

@router.post(
    "/summary-shares",
    response_model=SummaryShareResponse,
    status_code=201
)
def share_summary_with_classroom(
    share_data: SummaryShareCreate,
    current_user=Depends(
        require_roles(UserRole.EDUCATOR)
    ),
    db: Session = Depends(get_db)
):
    # Check whether the summary exists
    summary = db.query(Summary).filter(
        Summary.id == share_data.summary_id
    ).first()

    if summary is None:
        raise HTTPException(
            status_code=404,
            detail="Summary not found"
        )

    # Ensure the summary belongs to one of the educator's videos
    video = db.query(Video).filter(
        Video.id == summary.video_id,
        Video.owner_id == current_user.id
    ).first()

    if video is None:
        raise HTTPException(
            status_code=403,
            detail="You can only share summaries from your own videos"
        )

    # Ensure the classroom belongs to the logged-in educator
    classroom = db.query(Classroom).filter(
        Classroom.id == share_data.classroom_id,
        Classroom.educator_id == current_user.id
    ).first()

    if classroom is None:
        raise HTTPException(
            status_code=403,
            detail="You can only share summaries with your own classrooms"
        )

    # Prevent the same summary from being shared twice
    existing_share = db.query(SummaryShare).filter(
        SummaryShare.summary_id == share_data.summary_id,
        SummaryShare.classroom_id == share_data.classroom_id
    ).first()

    if existing_share:
        raise HTTPException(
            status_code=400,
            detail="This summary is already shared with this classroom"
        )

    # Create the share record
    summary_share = create_summary_share(
        db=db,
        summary_id=share_data.summary_id,
        classroom_id=share_data.classroom_id,
        shared_by=current_user.id
    )

    return summary_share


@router.get(
    "/summary-shares/my",
    response_model=List[SummaryResponse]
)
def get_my_shared_summaries(
    current_user=Depends(
        require_roles(UserRole.LEARNER)
    ),
    db: Session = Depends(get_db)
):
    summaries = get_shared_summaries_for_learner(
        db=db,
        learner_id=current_user.id
    )

    return summaries


