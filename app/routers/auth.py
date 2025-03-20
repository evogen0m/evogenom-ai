from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from app.services.auth import AuthServiceDep

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()


class TokenResponse(BaseModel):
    token: str


@router.post("/token", response_model=TokenResponse)
async def get_ephemeral_token(
    auth_service: AuthServiceDep,
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
) -> TokenResponse:
    """Generate an ephemeral token for websocket connections."""
    token = await auth_service.create_ephemeral_token(credentials.credentials)
    if not token:
        raise HTTPException(
            status_code=401, detail="Could not generate ephemeral token"
        )
    return TokenResponse(token=token)
