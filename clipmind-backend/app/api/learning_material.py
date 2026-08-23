from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.auth.authorization import require_roles
from app.core.enums import UserRole

from app.models.learning_material import LearningMaterial
from app.models.classroom import Classroom
from app.models.video import Video

from app.schemas.learning_material import (
    LearningMaterialResponse,
    LearningMaterialShareCreate,
    LearningMaterialShareResponse,
    LearningMaterialLearnerResponse
)

from app.crud.learning_material import (
    get_learning_material_by_id,
    get_learning_materials_by_educator,
    create_learning_material_share,
    get_existing_learning_material_share,
    get_shared_learning_materials_for_learner
)


router = APIRouter(
    prefix="/learning-materials",
    tags=["Learning Materials"]
)


# ============================================================
# GET EDUCATOR'S GENERATED LEARNING MATERIALS
# ============================================================

@router.get(
    "/my",
    response_model=list[LearningMaterialResponse]
)
def get_my_learning_materials(
    current_user=Depends(
        require_roles(UserRole.EDUCATOR)
    ),
    db: Session = Depends(get_db)
):

    return get_learning_materials_by_educator(
        db=db,
        educator_id=current_user.id
    )


# ============================================================
# SHARE LEARNING MATERIAL WITH CLASSROOM
# Educator only
# ============================================================

@router.post(
    "/share",
    response_model=LearningMaterialShareResponse,
    status_code=status.HTTP_201_CREATED
)
def share_learning_material(
    share_data: LearningMaterialShareCreate,
    current_user=Depends(
        require_roles(UserRole.EDUCATOR)
    ),
    db: Session = Depends(get_db)
):

    # ---------------------------------------------------------
    # Get material
    # ---------------------------------------------------------

    material = get_learning_material_by_id(
        db=db,
        material_id=share_data.learning_material_id
    )

    if material is None:

        raise HTTPException(
            status_code=404,
            detail="Learning material not found"
        )

    # ---------------------------------------------------------
    # Verify educator owns the material
    # ---------------------------------------------------------

    video = (
        db.query(Video)
        .filter(
            Video.id == material.video_id,
            Video.owner_id == current_user.id
        )
        .first()
    )

    if video is None:

        raise HTTPException(
            status_code=403,
            detail="You can only share your own learning materials"
        )

    # ---------------------------------------------------------
    # Verify classroom belongs to educator
    # ---------------------------------------------------------

    classroom = (
        db.query(Classroom)
        .filter(
            Classroom.id == share_data.classroom_id,
            Classroom.educator_id == current_user.id
        )
        .first()
    )

    if classroom is None:

        raise HTTPException(
            status_code=403,
            detail="You can only share with your own classrooms"
        )

    # ---------------------------------------------------------
    # Prevent duplicate sharing
    # ---------------------------------------------------------

    existing_share = get_existing_learning_material_share(
        db=db,
        learning_material_id=
            share_data.learning_material_id,
        classroom_id=
            share_data.classroom_id
    )

    if existing_share:

        raise HTTPException(
            status_code=400,
            detail=
                "This learning material is already shared with this classroom"
        )

    # ---------------------------------------------------------
    # Create share
    # ---------------------------------------------------------

    return create_learning_material_share(
        db=db,
        learning_material_id=
            share_data.learning_material_id,
        classroom_id=
            share_data.classroom_id,
        shared_by=current_user.id
    )


# ============================================================
# GET SHARED LEARNING MATERIALS
# Learner only
# ============================================================

@router.get(
    "/shared",
    response_model=list[LearningMaterialLearnerResponse]
)
def get_my_shared_learning_materials(
    current_user=Depends(
        require_roles(UserRole.LEARNER)
    ),
    db: Session = Depends(get_db)
):

    rows = get_shared_learning_materials_for_learner(
        db=db,
        learner_id=current_user.id
    )

    results = []

    for material, share, classroom in rows:

        video = (
            db.query(Video)
            .filter(
                Video.id == material.video_id
            )
            .first()
        )

        if video is None:
            continue

        results.append(
            {
                "id": material.id,
                "video_id": material.video_id,
                "video_filename": video.filename,
                "classroom_id": classroom.id,
                "classroom_name": classroom.name,
                "overview": material.overview,
                "key_learning_points":
                    material.key_learning_points,
                "study_notes": material.study_notes,
                "shared_at": share.shared_at
            }
        )

    return results


# ============================================================
# GET ONE LEARNING MATERIAL
# Learner only
# ============================================================

@router.get(
    "/{material_id}",
    response_model=LearningMaterialResponse
)
def get_learning_material(
    material_id: int,
    current_user=Depends(
        require_roles(UserRole.LEARNER)
    ),
    db: Session = Depends(get_db)
):

    material = get_learning_material_by_id(
        db=db,
        material_id=material_id
    )

    if material is None:

        raise HTTPException(
            status_code=404,
            detail="Learning material not found"
        )

    # ---------------------------------------------------------
    # Verify that this learner has access through a classroom
    # ---------------------------------------------------------

    from app.models.learning_material_share import (
        LearningMaterialShare
    )
    from app.models.classroom_member import ClassroomMember

    access = (
        db.query(LearningMaterialShare)
        .join(
            ClassroomMember,
            ClassroomMember.classroom_id
            == LearningMaterialShare.classroom_id
        )
        .filter(
            LearningMaterialShare.learning_material_id
            == material_id,
            ClassroomMember.learner_id
            == current_user.id
        )
        .first()
    )

    if access is None:

        raise HTTPException(
            status_code=403,
            detail="You do not have access to this learning material"
        )

    return material