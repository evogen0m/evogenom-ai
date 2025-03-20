import datetime
from typing import Annotated
from uuid import uuid4

from fastapi import Depends
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auth import EphemeralTokenModel
from app.settings import settings


class AuthServiceError(Exception):
    """Base exception for auth service errors."""

    def __init__(self, message: str = "An error occurred in the auth service"):
        self.message = message
        super().__init__(self.message)


class InvalidTokenError(AuthServiceError):
    """Raised when a token is invalid or expired."""

    def __init__(self, message: str = "Invalid or expired token"):
        self.message = message
        super().__init__(self.message)


class InvalidEphemeralTokenError(AuthServiceError):
    """Raised when a token is not found."""

    def __init__(self, message: str = "Token consumed, or not found, or expired"):
        self.message = message
        super().__init__(self.message)


TOKEN_EXPIRES_IN_MINUTES = 5


class AuthService:
    async def create_ephemeral_token(
        self, session: AsyncSession, token: str
    ) -> EphemeralTokenModel:
        userinfo_endpoint = await settings.get_user_info_url()

        async with httpx.AsyncClient() as client:
            response = await client.get(
                userinfo_endpoint, headers={"Authorization": f"Bearer {token}"}
            )
            if response.status_code != 200:
                raise InvalidTokenError(f"Invalid token: {response.status_code}")
            body = response.json()

        ephemeral_token = EphemeralTokenModel(
            ephemeral_token=str(uuid4()),
            user_info_response=body,
            expires_at=datetime.datetime.now()
            + datetime.timedelta(minutes=TOKEN_EXPIRES_IN_MINUTES),
        )
        session.add(ephemeral_token)
        await session.flush()
        return ephemeral_token

    async def consume_ephemeral_token(self, session: AsyncSession, token: str) -> bool:
        result = await session.execute(
            select(EphemeralTokenModel).filter(
                EphemeralTokenModel.ephemeral_token == token
            )
        )
        ephemeral_token = result.scalar_one_or_none()

        if ephemeral_token:
            # Consume the token
            await session.delete(ephemeral_token)
            await session.flush()
        else:
            raise InvalidEphemeralTokenError()

        if ephemeral_token.expires_at < datetime.datetime.now():
            raise InvalidEphemeralTokenError()

        return True


AuthServiceDep = Annotated[AuthService, Depends(AuthService)]