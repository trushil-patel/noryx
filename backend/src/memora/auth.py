from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from memora.models import User
from memora.supabase import auth_client

bearer = HTTPBearer(auto_error=False)


async def current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
) -> User:
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Authorization header is missing")
    try:
        response = auth_client().auth.get_user(credentials.credentials)
    except Exception as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token") from exc
    if response.user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    return User(id=response.user.id, email=response.user.email)


CurrentUser = Annotated[User, Depends(current_user)]
