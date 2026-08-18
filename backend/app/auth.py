import os
import time
import base64
import json
import hmac
import hashlib
from typing import Optional, Dict, Any
from fastapi import HTTPException, Security, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import UserModel

SECRET_KEY = os.getenv("JWT_SECRET", "clipmind_ai_super_secret_jwt_key_2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_SECONDS = 86400 * 7 # 7 days

security = HTTPBearer(auto_error=False)

PBKDF2_ALGORITHM = 'sha256'
PBKDF2_ITERATIONS = 100000
PBKDF2_SALT = "clipmind_salt_9921"
PBKDF2_KEYLEN = 32

def hash_password(password: str) -> str:
    """Secure PBKDF2 password hashing with salt"""
    key = hashlib.pbkdf2_hmac(
        PBKDF2_ALGORITHM,
        password.encode('utf-8'),
        PBKDF2_SALT.encode('utf-8'),
        PBKDF2_ITERATIONS,
        dklen=PBKDF2_KEYLEN
    )
    return key.hex()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not plain_password or not hashed_password:
        return False
    computed_hash = hash_password(plain_password)
    if hmac.compare_digest(computed_hash.lower(), hashed_password.lower()):
        return True

    # Check legacy PBKDF2 hashing without explicit dklen parameter or alternate salt encoding
    try:
        salt = "clipmind_salt_9921"
        legacy_key = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt.encode('utf-8'), 100000)
        if hmac.compare_digest(legacy_key.hex().lower(), hashed_password.lower()):
            return True
    except Exception:
        pass

    # Check sha256 or direct comparison fallback for legacy accounts
    try:
        sha256_hash = hashlib.sha256(plain_password.encode('utf-8')).hexdigest()
        if hmac.compare_digest(sha256_hash.lower(), hashed_password.lower()):
            return True
    except Exception:
        pass

    if hmac.compare_digest(plain_password, hashed_password):
        return True

    return False

def create_access_token(data: dict, expires_delta: Optional[int] = None) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    expire = now + (expires_delta or ACCESS_TOKEN_EXPIRE_SECONDS)
    payload = {**data, "iat": now, "exp": expire}

    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip('=')

    signature_input = f"{header_b64}.{payload_b64}".encode()
    signature = hmac.new(SECRET_KEY.encode(), signature_input, hashlib.sha256).digest()
    signature_b64 = base64.urlsafe_b64encode(signature).decode().rstrip('=')

    return f"{header_b64}.{payload_b64}.{signature_b64}"

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        header_b64, payload_b64, signature_b64 = parts

        # Verify signature
        signature_input = f"{header_b64}.{payload_b64}".encode()
        expected_sig = hmac.new(SECRET_KEY.encode(), signature_input, hashlib.sha256).digest()
        expected_sig_b64 = base64.urlsafe_b64encode(expected_sig).decode().rstrip('=')

        if not hmac.compare_digest(signature_b64, expected_sig_b64):
            return None

        # Base64 decode payload
        rem = len(payload_b64) % 4
        if rem > 0:
            payload_b64 += '=' * (4 - rem)
        payload_bytes = base64.urlsafe_b64decode(payload_b64)
        payload = json.loads(payload_bytes.decode('utf-8'))

        if payload.get("exp", 0) < int(time.time()):
            return None # Token expired

        return payload
    except Exception as e:
        return None

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security), db: Session = Depends(get_db)) -> UserModel:
    if credentials and credentials.credentials:
        token = credentials.credentials
        payload = decode_access_token(token)
        if payload:
            user_id = payload.get("sub")
            user = db.query(UserModel).filter(UserModel.id == user_id).first()
            if user:
                return user
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
        )
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated: Authorization token missing",
    )

def require_role(roles: list):
    def role_checker(current_user: UserModel = Depends(get_current_user)):
        if current_user.role not in roles and current_user.role != "ADMINISTRATOR":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User role '{current_user.role}' lacks permission for this action. Required: {roles}",
            )
        return current_user
    return role_checker
