from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.services.learning_history_service import (
    add_learning_history,
    get_learning_history,
    delete_learning_history,
    clear_learning_history
)

router = APIRouter(
    prefix="/learning-history",
    tags=["Learning History"]
)


# ==========================================
# Add / Update Learning History
# ==========================================

@router.post("/{user_id}/{video_id}")
def create_learning_history(
    user_id: int,
    video_id: int,
    progress: int = 0,
    db: Session = Depends(get_db)
):

    return add_learning_history(
        db=db,
        user_id=user_id,
        video_id=video_id,
        progress=progress
    )


# ==========================================
# Get User Learning History
# ==========================================

@router.get("/{user_id}")
def get_history(
    user_id: int,
    db: Session = Depends(get_db)
):

    return {
        "history": get_learning_history(
            db=db,
            user_id=user_id
        )
    }


# ==========================================
# Delete One History Record
# ==========================================

@router.delete("/{history_id}")
def delete_history(
    history_id: int,
    db: Session = Depends(get_db)
):

    return delete_learning_history(
        db=db,
        history_id=history_id
    )


# ==========================================
# Clear All User History
# ==========================================

@router.delete("/user/{user_id}")
def clear_history(
    user_id: int,
    db: Session = Depends(get_db)
):

    return clear_learning_history(
        db=db,
        user_id=user_id
    )