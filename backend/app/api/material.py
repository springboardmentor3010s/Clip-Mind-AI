from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.material import MaterialCreate, MaterialUpdate
from app.services.material_service import (
    create_material,
    get_materials_by_video,
    get_material,
    update_material,
    delete_material
)

router = APIRouter(
    prefix="/materials",
    tags=["Materials"]
)


# =====================================================
# Create Material
# =====================================================

@router.post("/")
def create_new_material(
    data: MaterialCreate,
    db: Session = Depends(get_db)
):
    return create_material(db, data)


# =====================================================
# Get All Materials for a Video
# =====================================================

@router.get("/video/{video_id}")
def get_materials(
    video_id: int,
    db: Session = Depends(get_db)
):
    return get_materials_by_video(db, video_id)


# =====================================================
# Get Single Material
# =====================================================

@router.get("/{material_id}")
def get_single_material(
    material_id: int,
    db: Session = Depends(get_db)
):
    return get_material(db, material_id)


# =====================================================
# Update Material
# =====================================================

@router.put("/{material_id}")
def edit_material(
    material_id: int,
    data: MaterialUpdate,
    db: Session = Depends(get_db)
):
    return update_material(db, material_id, data)


# =====================================================
# Delete Material
# =====================================================

@router.delete("/{material_id}")
def remove_material(
    material_id: int,
    db: Session = Depends(get_db)
):
    return delete_material(db, material_id)