from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.services.classroom_service import classroom_analytics

router = APIRouter(
    prefix="/classroom",
    tags=["Classroom Analytics"]
)


@router.get("/{educator_id}")
def get_classroom_analytics(
    educator_id: int,
    db: Session = Depends(get_db)
):
    return classroom_analytics(db, educator_id)