from sqlalchemy.orm import Session

from app.models.material import Material
from app.models.video import Video


# =====================================================
# Create Material
# =====================================================

def create_material(db: Session, data):

    # Check whether video exists
    video = (
        db.query(Video)
        .filter(Video.id == data.video_id)
        .first()
    )

    if not video:
        return {
            "success": False,
            "message": "Video not found."
        }

    material = Material(
        video_id=data.video_id,
        educator_id=data.educator_id,
        title=data.title,
        description=data.description,
        file_name=data.file_name,
        file_path=data.file_path,
        file_type=data.file_type
    )

    db.add(material)
    db.commit()
    db.refresh(material)

    return {
        "success": True,
        "message": "Material created successfully.",
        "material": material.to_dict()
    }


# =====================================================
# Get Materials By Video
# =====================================================

def get_materials_by_video(db: Session, video_id: int):

    video = (
        db.query(Video)
        .filter(Video.id == video_id)
        .first()
    )

    if not video:
        return {
            "success": False,
            "message": "Video not found."
        }

    materials = (
        db.query(Material)
        .filter(Material.video_id == video_id)
        .order_by(Material.created_at.desc())
        .all()
    )

    return {
        "success": True,
        "count": len(materials),
        "materials": [
            material.to_dict()
            for material in materials
        ]
    }


# =====================================================
# Get One Material
# =====================================================

def get_material(db: Session, material_id: int):

    material = (
        db.query(Material)
        .filter(Material.id == material_id)
        .first()
    )

    if not material:
        return {
            "success": False,
            "message": "Material not found."
        }

    return {
        "success": True,
        "material": material.to_dict()
    }


# =====================================================
# Update Material
# =====================================================

def update_material(db: Session, material_id: int, data):

    material = (
        db.query(Material)
        .filter(Material.id == material_id)
        .first()
    )

    if not material:
        return {
            "success": False,
            "message": "Material not found."
        }

    if data.title is not None:
        material.title = data.title

    if data.description is not None:
        material.description = data.description

    if data.file_name is not None:
        material.file_name = data.file_name

    if data.file_path is not None:
        material.file_path = data.file_path

    if data.file_type is not None:
        material.file_type = data.file_type

    db.commit()
    db.refresh(material)

    return {
        "success": True,
        "message": "Material updated successfully.",
        "material": material.to_dict()
    }


# =====================================================
# Delete Material
# =====================================================

def delete_material(db: Session, material_id: int):

    material = (
        db.query(Material)
        .filter(Material.id == material_id)
        .first()
    )

    if not material:
        return {
            "success": False,
            "message": "Material not found."
        }

    db.delete(material)
    db.commit()

    return {
        "success": True,
        "message": "Material deleted successfully."
    }