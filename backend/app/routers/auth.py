# backend/app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.models.user import UserRegister, UserResponse, UserRole
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

# Mock database for Milestone 1 testing (In production, replace with PostgreSQL queries)
MOCK_USER_DB = {}
current_id_counter = 1

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister):
    """
    Registers a new platform user, hashes their password, and sets their system role. [cite: 111, 113]
    """
    global current_id_counter
    
    # 1. Check if the user already exists
    if user_data.email in MOCK_USER_DB:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )
    
    # 2. Hash the plain-text password securely
    hashed = hash_password(user_data.password)
    
    # 3. Create the database record payload
    new_user = {
        "id": current_id_counter,
        "email": user_data.email,
        "hashed_password": hashed,
        "role": user_data.role,
        "is_active": True
    }
    
    # Save to mock storage
    MOCK_USER_DB[user_data.email] = new_user
    current_id_counter += 1
    
    return new_user


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Verifies user credentials and returns a secure JWT access token containing role claims. [cite: 38, 111]
    """
    # 1. Look up user by email (username field in standard OAuth2 forms)
    user = MOCK_USER_DB.get(form_data.username)
    
    # 2. Verify user existence and cross-check the hashed password
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Embed identity and authorization claims into the JWT token payload [cite: 38, 113]
    token_claims = {
        "sub": user["email"],
        "role": user["role"]
    }
    
    access_token = create_access_token(data=token_claims)
    
    # 4. Return standard OAuth2 token response layout along with user metadata for the frontend
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "email": user["email"],
        "role": user["role"]
    }