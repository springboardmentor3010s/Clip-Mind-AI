"""
Authentication router: register, login, logout.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.auth import RegisterRequest, LoginRequest, Token
from app.services.auth_service import AuthService
from app.services.activity_service import log_activity


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Register a new user account.

    - **email**: User's email (must be unique)
    - **username**: Username (must be unique, 3-100 chars)
    - **full_name**: Full name
    - **password**: Password (min 8 chars)
    - **role_name**: One of Learner, Content Creator, Educator
    """
    try:
        user = AuthService.register_user(db, payload)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    log_activity(
        db, user_id=user.id, action="register",
        resource_type="user", resource_id=user.id,
        description=f"New account registered as {user.email}",
        request=request,
    )
    token = AuthService.create_token(user)
    return Token(access_token=token, token_type="bearer")


@router.post("/login", response_model=Token)
def login(
    payload: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Authenticate and receive a JWT access token.

    - **email**: User's email
    - **password**: User's password
    - **role_name**: Optional role name to filter login (e.g., Administrator)
    """
    user = AuthService.authenticate_user(db, payload.email, payload.password, payload.role_name)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    log_activity(
        db, user_id=user.id, action="login",
        resource_type="user", resource_id=user.id,
        description=f"User {user.email} logged in as {user.role}",
        request=request,
    )
    token = AuthService.create_token(user)
    return Token(access_token=token, token_type="bearer")


@router.post("/logout")
def logout():
    """
    Logout the current user.

    Note: With JWT, logout is handled client-side by deleting the token.
    This endpoint exists for API completeness.
    """
    return {"message": "Successfully logged out. Please delete your token client-side."}
