from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.services.dashboard_service import (
    get_admin_dashboard,
    get_creator_dashboard,
    get_educator_dashboard,
    get_learner_dashboard
)

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


# ==========================================
# Database Dependency
# ==========================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==========================================
# Admin Dashboard
# ==========================================

@router.get("/admin")
def admin_dashboard(
    db: Session = Depends(get_db)
):

    return get_admin_dashboard(db)


# ==========================================
# Creator Dashboard
# ==========================================

@router.get("/creator")
def creator_dashboard(
    db: Session = Depends(get_db)
):

    return get_creator_dashboard(db)


# ==========================================
# Educator Dashboard
# ==========================================

@router.get("/educator")
def educator_dashboard(
    db: Session = Depends(get_db)
):

    return get_educator_dashboard(db)


# ==========================================
# Learner Dashboard
# ==========================================

@router.get("/learner")
def learner_dashboard(
    db: Session = Depends(get_db)
):

    return get_learner_dashboard(db)