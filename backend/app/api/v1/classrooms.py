"""
Classroom Module endpoints.
"""
import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User, UserRole
from app.schemas.classroom import ClassroomCreate, ClassroomJoin, ClassroomMemberOut, ClassroomOut
from app.schemas.classroom_analytics import ClassroomAnalytics
from app.services.classroom_analytics_service import get_classroom_analytics
from app.services.classroom_service import (
    create_classroom,
    delete_classroom,
    get_roster,
    join_classroom,
    list_my_classrooms,
    remove_member,
)

router = APIRouter(prefix="/classrooms", tags=["Classrooms"])


@router.post("", response_model=ClassroomOut, status_code=status.HTTP_201_CREATED)
def create_classroom_endpoint(
    payload: ClassroomCreate,
    current_user: User = Depends(require_role(UserRole.EDUCATOR)),
    db: Session = Depends(get_db),
):
    """Educator-only: create a new classroom, returning its invite code."""
    return create_classroom(db, payload.name, current_user)


@router.get("/mine", response_model=list[ClassroomOut])
def get_my_classrooms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Educator: classrooms you created. Learner: classrooms you've joined."""
    return list_my_classrooms(db, current_user)


@router.post("/join", response_model=ClassroomOut)
def join_classroom_endpoint(
    payload: ClassroomJoin,
    current_user: User = Depends(require_role(UserRole.LEARNER)),
    db: Session = Depends(get_db),
):
    """Learner-only: join a classroom using its invite code."""
    return join_classroom(db, payload.invite_code, current_user)


@router.get("/{classroom_id}/roster", response_model=list[ClassroomMemberOut])
def get_classroom_roster(
    classroom_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.EDUCATOR)),
    db: Session = Depends(get_db),
):
    """Educator-only (must own the classroom): list enrolled students."""
    return get_roster(db, classroom_id, current_user)


@router.delete("/{classroom_id}/members/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_classroom_member(
    classroom_id: uuid.UUID,
    student_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.EDUCATOR)),
    db: Session = Depends(get_db),
):
    """Educator-only (must own the classroom): remove a student from the roster."""
    remove_member(db, classroom_id, student_id, current_user)


@router.delete("/{classroom_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_classroom_endpoint(
    classroom_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.EDUCATOR)),
    db: Session = Depends(get_db),
):
    """Educator-only (must own the classroom): delete it entirely."""
    delete_classroom(db, classroom_id, current_user)


@router.get("/{classroom_id}/analytics", response_model=ClassroomAnalytics)
async def get_classroom_analytics_endpoint(
    classroom_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.EDUCATOR)),
    db: Session = Depends(get_db),
):
    """Educator-only (must own the classroom): engagement metrics across every shared video."""
    return await get_classroom_analytics(db, classroom_id, current_user)