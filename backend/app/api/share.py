from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.services.share_service import (
    share_video,
    get_shared_videos,
    get_learner_videos,
    delete_share
)

router = APIRouter(
    prefix="/share",
    tags=["Share Lecture"]
)


# =====================================================
# Request Model
# =====================================================

class ShareRequest(BaseModel):
    educator_id: int
    learner_id: int
    video_id: int


# =====================================================
# Share Lecture
# POST /share
# =====================================================

@router.post("/")
def share(
    request: ShareRequest,
    db: Session = Depends(get_db)
):
    return share_video(
        db=db,
        educator_id=request.educator_id,
        learner_id=request.learner_id,
        video_id=request.video_id
    )


# =====================================================
# Get Shared Lectures by Educator
# GET /share/educator/{educator_id}
# =====================================================

@router.get("/educator/{educator_id}")
def educator_shared(
    educator_id: int,
    db: Session = Depends(get_db)
):
    return get_shared_videos(
        db=db,
        educator_id=educator_id
    )


# =====================================================
# Get Shared Lectures for Learner
# GET /share/learner/{learner_id}
# =====================================================

@router.get("/learner/{learner_id}")
def learner_shared(
    learner_id: int,
    db: Session = Depends(get_db)
):
    return get_learner_videos(
        db=db,
        learner_id=learner_id
    )


# =====================================================
# Delete Shared Lecture
# DELETE /share/{share_id}
# =====================================================

@router.delete("/{share_id}")
def remove_share(
    share_id: int,
    db: Session = Depends(get_db)
):
    return delete_share(
        db=db,
        share_id=share_id
    )