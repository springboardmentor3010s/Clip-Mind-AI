from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.auth.authorization import require_roles
from app.core.enums import UserRole
from app.models.user import User

from app.models.video import Video
from app.schemas.video import VideoResponse

from app.schemas.classroom import (
    ClassroomCreate,
    ClassroomResponse,
    ClassroomMemberCreate,
    ClassroomMemberResponse
    
)

from app.crud.classroom import (
    create_classroom,
    get_classrooms_by_educator,
    get_classroom_by_id_and_educator,
    get_existing_classroom_member,
    add_learner_to_classroom,
    get_classroom_members,
    remove_learner_from_classroom,
    get_classrooms_for_learner,
    get_classroom_for_learner
    
)


router = APIRouter(
    prefix="/classrooms",
    tags=["Classrooms"]
)


# ============================================================
# CREATE CLASSROOM
# Educator only
# ============================================================

@router.post(
    "",
    response_model=ClassroomResponse,
    status_code=status.HTTP_201_CREATED
)
def create_new_classroom(
    classroom_data: ClassroomCreate,
    current_user=Depends(
        require_roles(UserRole.EDUCATOR)
    ),
    db: Session = Depends(get_db)
):

    classroom = create_classroom(
        db=db,
        name=classroom_data.name,
        description=classroom_data.description,
        educator_id=current_user.id
    )

    return classroom


# ============================================================
# GET MY CLASSROOMS
# Educator only
# ============================================================

@router.get(
    "",
    response_model=List[ClassroomResponse]
)
def get_my_classrooms(
    current_user=Depends(
        require_roles(UserRole.EDUCATOR)
    ),
    db: Session = Depends(get_db)
):

    classrooms = get_classrooms_by_educator(
        db=db,
        educator_id=current_user.id
    )

    return classrooms

# ============================================================
# ADD LEARNER TO CLASSROOM
# Educator only
# ============================================================

@router.post(
    "/{classroom_id}/learners",
    response_model=ClassroomMemberResponse,
    status_code=status.HTTP_201_CREATED
)
def add_learner(
    classroom_id: int,
    member_data: ClassroomMemberCreate,
    current_user=Depends(
        require_roles(UserRole.EDUCATOR)
    ),
    db: Session = Depends(get_db)
):

    # ---------------------------------------------------------
    # Verify classroom belongs to the logged-in educator
    # ---------------------------------------------------------

    classroom = get_classroom_by_id_and_educator(
        db=db,
        classroom_id=classroom_id,
        educator_id=current_user.id
    )

    if classroom is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Classroom not found"
        )

    # ---------------------------------------------------------
    # Find learner using ID, username, or email
    # ---------------------------------------------------------

    identifier = member_data.learner_identifier.strip()

    learner = None

    # First try numeric learner ID
    if identifier.isdigit():

        learner = (
            db.query(User)
            .filter(User.id == int(identifier))
            .first()
        )

    # If not found by ID, try username or email
    if learner is None:

        learner = (
            db.query(User)
            .filter(
                (User.username == identifier) |
                (User.email == identifier)
            )
            .first()
        )

    if learner is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learner not found"
        )

    # ---------------------------------------------------------
    # Verify user is actually a learner
    # ---------------------------------------------------------

    if learner.role != UserRole.LEARNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only users with the LEARNER role can be added to a classroom"
        )

    # ---------------------------------------------------------
    # Prevent duplicate membership
    # ---------------------------------------------------------

    existing_member = get_existing_classroom_member(
        db=db,
        classroom_id=classroom_id,
        learner_id=learner.id
    )

    if existing_member is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This learner is already in the classroom"
        )

    # ---------------------------------------------------------
    # Add learner
    # ---------------------------------------------------------

    membership = add_learner_to_classroom(
        db=db,
        classroom_id=classroom_id,
        learner_id=learner.id
    )

    return {
        "id": membership.id,
        "learner_id": learner.id,
        "username": learner.username,
        "full_name": learner.full_name,
        "email": learner.email,
        "joined_at": membership.joined_at
    }

# ============================================================
# REMOVE LEARNER FROM CLASSROOM
# ============================================================

@router.delete(
    "/{classroom_id}/learners/{learner_id}"
)
def remove_learner(
    classroom_id: int,
    learner_id: int,
    current_user=Depends(
        require_roles(UserRole.EDUCATOR)
    ),
    db: Session = Depends(get_db)
):

    # ---------------------------------------------------------
    # Verify classroom belongs to the logged-in educator
    # ---------------------------------------------------------

    classroom = get_classroom_by_id_and_educator(
        db=db,
        classroom_id=classroom_id,
        educator_id=current_user.id
    )

    if classroom is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Classroom not found"
        )

    # ---------------------------------------------------------
    # Find and remove the learner membership
    # ---------------------------------------------------------

    removed = remove_learner_from_classroom(
        db=db,
        classroom_id=classroom_id,
        learner_id=learner_id
    )

    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learner is not enrolled in this classroom"
        )

    return {
        "message": "Learner removed from classroom successfully"
    }

# ============================================================
# GET CLASSROOM LEARNERS
# Educator only
# ============================================================

@router.get(
    "/{classroom_id}/learners",
    response_model=List[ClassroomMemberResponse]
)
def get_learners_in_classroom(
    classroom_id: int,
    current_user=Depends(
        require_roles(UserRole.EDUCATOR)
    ),
    db: Session = Depends(get_db)
):

    # ---------------------------------------------------------
    # Verify classroom belongs to the logged-in educator
    # ---------------------------------------------------------

    classroom = get_classroom_by_id_and_educator(
        db=db,
        classroom_id=classroom_id,
        educator_id=current_user.id
    )

    if classroom is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Classroom not found"
        )

    memberships = get_classroom_members(
        db=db,
        classroom_id=classroom_id
    )

    results = []

    for membership in memberships:

        learner = (
            db.query(User)
            .filter(
                User.id == membership.learner_id
            )
            .first()
        )

        if learner is None:
            continue

        results.append(
            {
                "id": membership.id,
                "learner_id": learner.id,
                "username": learner.username,
                "full_name": learner.full_name,
                "email": learner.email,
                "joined_at": membership.joined_at
            }
        )

    return results

# ============================================================
# GET CLASSROOM LECTURES
# Educator only
# ============================================================

@router.get(
    "/{classroom_id}/videos",
    response_model=List[VideoResponse]
)
def get_classroom_videos(
    classroom_id: int,
    current_user=Depends(
        require_roles(UserRole.EDUCATOR)
    ),
    db: Session = Depends(get_db)
):

    # Verify classroom belongs to the logged-in educator
    classroom = get_classroom_by_id_and_educator(
        db=db,
        classroom_id=classroom_id,
        educator_id=current_user.id
    )

    if classroom is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Classroom not found"
        )

    # Get videos assigned to this classroom
    videos = (
        db.query(Video)
        .filter(
            Video.classroom_id == classroom_id
        )
        .order_by(
            Video.created_at.desc()
        )
        .all()
    )

    return videos

# ============================================================
# GET CLASSROOM LECTURES FOR LEARNER
# Learner only
# ============================================================

@router.get(
    "/{classroom_id}/lectures",
    response_model=List[VideoResponse]
)
def get_classroom_lectures_for_learner(
    classroom_id: int,
    current_user=Depends(
        require_roles(UserRole.LEARNER)
    ),
    db: Session = Depends(get_db)
):

    # ---------------------------------------------------------
    # Verify learner is enrolled in this classroom
    # ---------------------------------------------------------

    classroom = get_classroom_for_learner(
        db=db,
        classroom_id=classroom_id,
        learner_id=current_user.id
    )

    if classroom is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not enrolled in this classroom"
        )

    # ---------------------------------------------------------
    # Get lectures assigned to this classroom
    # ---------------------------------------------------------

    videos = (
        db.query(Video)
        .filter(
            Video.classroom_id == classroom_id
        )
        .order_by(
            Video.created_at.desc()
        )
        .all()
    )

    return videos

# ============================================================
# GET MY CLASSROOMS
# Learner only
# ============================================================

@router.get(
    "/my",
    response_model=List[ClassroomResponse]
)
def get_my_enrolled_classrooms(
    current_user=Depends(
        require_roles(UserRole.LEARNER)
    ),
    db: Session = Depends(get_db)
):

    classrooms = get_classrooms_for_learner(
        db=db,
        learner_id=current_user.id
    )

    return classrooms