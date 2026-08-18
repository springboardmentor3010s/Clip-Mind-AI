from datetime import datetime, timedelta, timezone
from typing import List, Optional
import jwt
from fastapi import Depends, HTTPException, Header, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = "SUPER_SECRET_PLATFORM_KEY_CHANGE_THIS_IN_PRODUCTION"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user_claims(
    token: Optional[str] = Depends(oauth2_scheme),
    x_user_role: Optional[str] = Header(default=None)
) -> dict:
    """
    Role resolution hierarchy:
    1. If X-User-Role header is explicitly sent (dynamic UI role switch), use it.
    2. Otherwise, decode from the JWT access token.
    3. Fallback to 'Learner'.
    """
    role_map = {
        "creator": "Content Creator",
        "content creator": "Content Creator",
        "learner": "Learner",
        "educator": "Educator",
        "admin": "Administrator",
        "administrator": "Administrator"
    }

    # 1. Header takes precedence for frontend role-switcher
    if x_user_role:
        normalized = role_map.get(x_user_role.strip().lower(), x_user_role.strip())
        return {"email": "admin@clipmind.ai", "role": normalized}

    # 2. Token fallback
    if token:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            raw_role = payload.get("role", "Learner")
            return {
                "email": payload.get("sub", "user@clipmind.ai"),
                "role": role_map.get(str(raw_role).lower(), raw_role)
            }
        except jwt.PyJWTError:
            pass

    return {"email": "anonymous@clipmind.ai", "role": "Learner"}

def require_roles(allowed_roles: List[str]):
    """RBAC gatekeeper verifying normalized roles."""
    def role_checker(claims: dict = Depends(get_current_user_claims)):
        user_role = str(claims.get("role", "")).strip().lower()
        normalized_allowed = [r.strip().lower() for r in allowed_roles]
        
        # Accept variations like 'admin' / 'administrator'
        if "administrator" in normalized_allowed:
            normalized_allowed.append("admin")
        if "content creator" in normalized_allowed:
            normalized_allowed.append("creator")

        if user_role not in normalized_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: Role '{claims.get('role')}' lacks required permissions ({', '.join(allowed_roles)})."
            )
        return claims
    return role_checker