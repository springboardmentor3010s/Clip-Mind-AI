from sqlalchemy.orm import Session

from app.models.learning_material import LearningMaterial
from app.models.learning_material_share import LearningMaterialShare
from app.models.video import Video
from app.models.classroom import Classroom
from app.models.classroom_member import ClassroomMember


def get_learning_material_by_video(
    db: Session,
    video_id: int
):
    return (
        db.query(LearningMaterial)
        .filter(
            LearningMaterial.video_id == video_id
        )
        .first()
    )


def get_learning_material_by_id(
    db: Session,
    material_id: int
):
    return (
        db.query(LearningMaterial)
        .filter(
            LearningMaterial.id == material_id
        )
        .first()
    )


def create_learning_material(
    db: Session,
    video_id: int,
    created_by: int,
    overview: str,
    key_learning_points: list[str],
    study_notes: str
):

    material = LearningMaterial(
        video_id=video_id,
        created_by=created_by,
        overview=overview,
        key_learning_points=key_learning_points,
        study_notes=study_notes
    )

    db.add(material)
    db.commit()
    db.refresh(material)

    return material


def update_learning_material(
    db: Session,
    material: LearningMaterial,
    overview: str,
    key_learning_points: list[str],
    study_notes: str
):

    material.overview = overview
    material.key_learning_points = key_learning_points
    material.study_notes = study_notes

    db.commit()
    db.refresh(material)

    return material


def create_learning_material_share(
    db: Session,
    learning_material_id: int,
    classroom_id: int,
    shared_by: int
):

    share = LearningMaterialShare(
        learning_material_id=learning_material_id,
        classroom_id=classroom_id,
        shared_by=shared_by
    )

    db.add(share)
    db.commit()
    db.refresh(share)

    return share


def get_existing_learning_material_share(
    db: Session,
    learning_material_id: int,
    classroom_id: int
):

    return (
        db.query(LearningMaterialShare)
        .filter(
            LearningMaterialShare.learning_material_id
            == learning_material_id,
            LearningMaterialShare.classroom_id
            == classroom_id
        )
        .first()
    )


def get_learning_materials_by_educator(
    db: Session,
    educator_id: int
):

    return (
        db.query(LearningMaterial)
        .join(
            Video,
            LearningMaterial.video_id == Video.id
        )
        .filter(
            LearningMaterial.created_by == educator_id
        )
        .order_by(
            LearningMaterial.created_at.desc()
        )
        .all()
    )


def get_shared_learning_materials_for_learner(
    db: Session,
    learner_id: int
):

    return (
        db.query(
            LearningMaterial,
            LearningMaterialShare,
            Classroom
        )
        .join(
            LearningMaterialShare,
            LearningMaterial.id
            == LearningMaterialShare.learning_material_id
        )
        .join(
            Classroom,
            Classroom.id
            == LearningMaterialShare.classroom_id
        )
        .join(
            ClassroomMember,
            ClassroomMember.classroom_id
            == Classroom.id
        )
        .join(
            Video,
            Video.id
            == LearningMaterial.video_id
        )
        .filter(
            ClassroomMember.learner_id == learner_id
        )
        .order_by(
            LearningMaterialShare.shared_at.desc()
        )
        .all()
    )