"""
User router: profile management endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.user import UserRead, UserUpdate, UserProfile
from app.services.user_service import UserService
from app.auth.dependencies import get_current_user


router = APIRouter(
    prefix="/api/users",
    tags=["Users"],
)


@router.get("/me", response_model=UserRead)
def get_current_user_profile(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get the current user's full profile.

    Requires authentication.
    """
    user = UserService.get_user_with_role(db, current_user.id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.put("/profile", response_model=UserRead)
def update_profile(
    payload: UserUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update the current user's profile.

    - **full_name**: New full name (optional)
    - **avatar_url**: New avatar URL (optional)
    - **is_active**: Account active status (optional)

    Requires authentication.
    """
    user = UserService.get_user_with_role(db, current_user.id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    try:
        updated_user = UserService.update_user_profile(db, user, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return updated_user


@router.delete("/delete", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete the current user's account.

    Requires authentication.
    """
    user = UserService.get_user_with_role(db, current_user.id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    UserService.delete_user(db, user)
    return None
