from typing import Optional

from app.core.security import decode_access_token
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

http_bearer = HTTPBearer()


def get_current_user_claims(credentials: HTTPAuthorizationCredentials = Depends(http_bearer)) -> dict:
    user = decode_access_token(credentials.credentials)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid or Expired Token")
    return user


def require_roles(*allowed_roles: str):
    def dependency(claims: dict = Depends(get_current_user_claims)) -> dict:
        if claims.get("role") not in allowed_roles:
            raise HTTPException(status_code=403, detail="You do not have permission to perform this action.")
        return claims
    return dependency