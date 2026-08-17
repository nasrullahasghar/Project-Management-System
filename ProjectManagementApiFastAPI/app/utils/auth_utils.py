from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext

from ProjectManagementApiFastAPI.app.core.config import settings

# passlib's bcrypt scheme produces standard bcrypt hashes - the same format
# BCrypt.Net-Next uses, so this is a drop-in equivalent to:
#   BCrypt.Net.BCrypt.HashPassword(...) / BCrypt.Net.BCrypt.Verify(...)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTPBearer is what makes FastAPI's /docs show the same "Authorize" padlock
# button you get from the Swagger Bearer security scheme in Program.cs.
bearer_scheme = HTTPBearer()


def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def create_access_token(user_id: int, email: str, full_name: str, role: str) -> str:
    """
    Equivalent to AuthController.GenerateJwtToken(). Uses clean standard JWT
    claim names (sub/email/name/role) rather than .NET's long ClaimTypes URIs,
    since this backend is standalone rather than needing token interop.
    """
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "email": email,
        "name": full_name,
        "role": role,
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_expiry_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm="HS256")


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=["HS256"],
            issuer=settings.jwt_issuer,
            audience=settings.jwt_audience,
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user_claims(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """
    FastAPI dependency equivalent to [Authorize] in .NET controllers.
    Add `claims: dict = Depends(get_current_user_claims)` to any route
    parameter list to require a valid JWT.
    """
    return decode_access_token(credentials.credentials)


def require_roles(*allowed_roles: str):
    """
    Equivalent to [Authorize(Roles = "Admin,ProjectManager")] in .NET.
    Usage: Depends(require_roles("Admin", "ProjectManager"))
    """

    def dependency(claims: dict = Depends(get_current_user_claims)) -> dict:
        if claims.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )
        return claims

    return dependency
