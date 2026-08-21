from pydantic import BaseModel, EmailStr

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Video
from app.utils.jwt import verify_token
from app.utils.role_guard import normalize_role
from app.utils.activity_logger import log_activity
from app.models.activity_log import ActivityLog

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

security = HTTPBearer()


class UpdateProfileRequest(BaseModel):
    username: str
    email: EmailStr


@router.get("/me")
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials

    payload = verify_token(token)

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

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": normalize_role(user.role),
    }

@router.get("/learner-stats")
def get_learner_stats(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials

    payload = verify_token(token)

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

    # Total videos available to learners
    total_videos = db.query(Video).count()

    # Videos with generated summaries
    total_summaries = db.query(Video).filter(
        Video.summary.isnot(None),
        Video.summary != ""
    ).count()

    # Videos with generated transcripts
    total_transcripts = db.query(Video).filter(
        Video.transcript.isnot(None),
        Video.transcript != ""
    ).count()


    return {
        "available_videos": total_videos,
        "ai_summaries": total_summaries,
        "transcripts": total_transcripts,
    
    }

@router.put("/profile")
def update_profile(
    profile: UpdateProfileRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials

    payload = verify_token(token)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    current_email = payload.get("sub")

    user = db.query(User).filter(
        User.email == current_email
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    

    # Check whether another user already has this email
    existing_user = db.query(User).filter(
        User.email == profile.email,
        User.id != user.id
    ).first()

    if existing_user is not None:
        raise HTTPException(
            status_code=400,
            detail="Email is already registered by another user."
        )

    username = profile.username.strip()

    if not username:
        raise HTTPException(
            status_code=400,
            detail="Username cannot be empty."
        )

    user.username = username
    user.email = profile.email

    db.commit()
    db.refresh(user)
    log_activity(
        db=db,
        user_id=user.id,
        action="Profile Updated",
        description="User updated their profile information."
    )

    return {
        "message": "Profile updated successfully.",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
        }
    }

@router.get("/activity-history")
def get_activity_history(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials

    payload = verify_token(token)

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

    activities = (
        db.query(ActivityLog)
        .filter(ActivityLog.user_id == user.id)
        .order_by(ActivityLog.timestamp.desc())
        .all()
    )

    return [
        {
            "id": activity.id,
            "action": activity.action,
            "description": activity.description,
            "timestamp": activity.timestamp,
        }
        for activity in activities
    ]

@router.get("/learning-history")
def get_learning_history(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials

    payload = verify_token(token)

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

    if user.role != "learner":
        raise HTTPException(
            status_code=403,
            detail="Only learners can access learning history."
        )

    learning_actions = [
        "Video Viewed",
        "Transcript Viewed",
        "Summary Viewed",
        "Keywords Viewed",
        "Key Moments Viewed",
        "AI Report Viewed",
    
    ]

    logs = (
        db.query(ActivityLog)
        .filter(
            ActivityLog.user_id == user.id,
            ActivityLog.action.in_(learning_actions)
        )
        .order_by(ActivityLog.timestamp.desc())
        .all()
    )

    return logs

@router.post("/learning-activity")
def log_learning_activity(
    activity: dict,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials

    payload = verify_token(token)

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

    if user.role != "learner":
        raise HTTPException(
            status_code=403,
            detail="Only learners can create learning history."
        )

    action = activity.get("action")
    description = activity.get("description", "")

    allowed_actions = [
        "Video Viewed",
        "Transcript Viewed",
        "Summary Viewed",
        "Keywords Viewed",
        "Key Moments Viewed",
        "AI Report Viewed",
    ]

    if action not in allowed_actions:
        raise HTTPException(
            status_code=400,
            detail="Invalid learning activity."
        )

    log_activity(
        db=db,
        user_id=user.id,
        action=action,
        description=description,
    )

    return {
        "message": "Learning activity saved."
    }