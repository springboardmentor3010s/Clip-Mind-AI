# backend/app/core/security.py
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
import jwt

# 1. Initialize the password context using bcrypt (hashing mechanics)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 2. Configuration constants for JWT signing signatures
SECRET_KEY = "SUPER_SECRET_PLATFORM_KEY_CHANGE_THIS_IN_PRODUCTION"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def hash_password(password: str) -> str:
    """Transforms plain text passwords into secure, salted cryptographic hashes."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Cross-references a plain text password attempt against the saved database hash."""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    """Generates a signed JWT access token containing target claims and expiration windows."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt