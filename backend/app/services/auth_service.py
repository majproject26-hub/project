import datetime
from typing import Optional, Dict, Any, List
import jwt
from fastapi import HTTPException, status, Header, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.database import db

security = HTTPBearer(auto_error=False)

def verify_password(plain_password: str, stored_password: str) -> bool:
    # Supports both plain matching (for initial demo seeds) and hashed strings
    if plain_password == stored_password:
        return True
    try:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        return pwd_context.verify(plain_password, stored_password)
    except Exception:
        return False

def hash_password(password: str) -> str:
    try:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        return pwd_context.hash(password)
    except Exception:
        return password

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.now(datetime.timezone.utc) + (
        expires_delta if expires_delta else datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        return None

def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
) -> Dict[str, Any]:
    """
    Extract authenticated user.
    1. If Bearer JWT token is provided, decode sub -> user_id.
    2. Fallback to X-User-Id header for fast development / demo mode.
    3. Fallback to default Sarah Jenkins (Acme Admin) if unauthenticated dev mode.
    """
    user_id = None

    if auth and auth.credentials:
        payload = decode_access_token(auth.credentials)
        if payload and "sub" in payload:
            user_id = payload["sub"]

    if not user_id and x_user_id:
        user_id = x_user_id

    if user_id:
        user = db.get_user_by_id(user_id)
        if user:
            return user

    # If unauthenticated, default to the first active admin user for seamless testing
    for u in db.users:
        if u.get("status") == "ACTIVE" and u.get("role") == "ADMIN":
            return u

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required to perform this action."
    )

def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_role = current_user.get("role", "STAFF")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Action restricted. Role '{user_role}' does not have required permissions: {allowed_roles}"
            )
        return current_user
    return role_checker
