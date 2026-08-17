from typing import Optional
from jose import JWTError, jwt
from app.core.config import settings
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone

# <==============> Password Hashing <=====================>
hash = CryptContext(schemes="bcrypt", deprecated="auto")

def hash_password(plain_password: str) -> str:
    hashed_password = hash.hash(plain_password)
    return hashed_password

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash.verify(plain_password, hashed_password)


# <==============> JWT Token <=====================>

def create_access_token(user_id, email, full_name, role):
    current_time = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "email": email,
        "name": full_name,
        "role": role,
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "iat": current_time,
        "exp": current_time + timedelta(minutes=settings.jwt_expiry_minutes),
    }

    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm="HS256"
    )


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
            issuer=settings.jwt_issuer,
            audience=settings.jwt_audience
        )
        return payload

    except JWTError:
        return None