from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Video 
from app.schemas import VideoResponse
from app.services.video_service import save_video
from app.utils.jwt import verify_token
from app.schemas import TranscriptResponse, SummaryResponse

router = APIRouter(
    prefix="/videos",
    tags=["Videos"]
)

security = HTTPBearer()


@router.post(
    "/upload",
    response_model=VideoResponse
)
def upload_video(
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    print("Filename:", file.filename)
    print("Content Type:", file.content_type)

    # Verify JWT
    print("TOKEN RECEIVED:", credentials.credentials)

    payload = verify_token(credentials.credentials)

    print("PAYLOAD:", payload)

    if payload is None:
      raise HTTPException(
        status_code=401,
        detail="Invalid token"
    )

    email = payload.get("sub")

    user = db.query(User).filter(
        User.email == email
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Validate file type
    allowed_extensions = [
        ".mp4",
        ".avi",
        ".mov",
        ".mkv",
    ]

    if not any(
        file.filename.lower().endswith(ext)
        for ext in allowed_extensions
    ):
        raise HTTPException(
            status_code=400,
            detail="Unsupported video format."
        )

    video = save_video(
        db=db,
        file=file,
        user_id=user.id,
    )

    return video

@router.get(
    "/my-videos",
    response_model=list[VideoResponse]
)
def get_my_videos(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    # Verify JWT
    print("TOKEN RECEIVED:", credentials.credentials)
    payload = verify_token(credentials.credentials)
    print("PAYLOAD:", payload)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    email = payload.get("sub")

    user = db.query(User).filter(
        User.email == email
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    videos = (
        db.query(Video)
        .filter(Video.uploaded_by == user.id)
        .order_by(Video.id.desc())
        .all()
    )

    return videos

@router.get(
    "/{video_id}/transcript",
    response_model=TranscriptResponse
)
def get_transcript(
    video_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):

    payload = verify_token(credentials.credentials)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    email = payload.get("sub")

    user = db.query(User).filter(
        User.email == email
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    video = db.query(Video).filter(
        Video.id == video_id,
        Video.uploaded_by == user.id
    ).first()

    if video is None:
        raise HTTPException(
            status_code=404,
            detail="Video not found"
        )

    return video

@router.get(
    "/{video_id}/summary",
    response_model=SummaryResponse
)
def get_summary(
    video_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):

    payload = verify_token(credentials.credentials)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    email = payload.get("sub")

    user = db.query(User).filter(
        User.email == email
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    video = db.query(Video).filter(
        Video.id == video_id,
        Video.uploaded_by == user.id
    ).first()

    if video is None:
        raise HTTPException(
            status_code=404,
            detail="Video not found"
        )

    return video