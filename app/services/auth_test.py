import datetime
import uuid
from typing import AsyncGenerator
from unittest.mock import AsyncMock

import httpx
import pytest
from pytest_httpx import HTTPXMock
from pytest_mock import MockerFixture
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auth import EphemeralTokenModel
from app.services.auth import (
    TOKEN_EXPIRES_IN_MINUTES,
    AuthService,
    InvalidEphemeralTokenError,
    InvalidTokenError,
)
from app.settings import Settings


@pytest.fixture(scope="function")
async def auth_service():
    return AuthService()


async def test_create_ephemeral_token_success(
    httpx_mock: HTTPXMock,
    db_session: AsyncSession,
    auth_service: AuthService,
    mocker: MockerFixture,
):
    # Given
    test_url = "http://test-server/userinfo"
    mocker.patch.object(
        Settings,
        "get_user_info_url",
        new_callable=AsyncMock,
        return_value=test_url,
    )
    test_token = "valid-token"

    httpx_mock.add_response(
        url=test_url,
        method="GET",
        json={
            "sub": "test-user",
            "email": "test@example.com",
        },
        match_headers={"Authorization": f"Bearer {test_token}"},
    )

    # When
    result = await auth_service.create_ephemeral_token(db_session, test_token)

    # Then
    assert isinstance(result, EphemeralTokenModel)
    assert isinstance(result.ephemeral_token, str)
    assert len(result.ephemeral_token) > 0
    assert result.user_info_response == {
        "sub": "test-user",
        "email": "test@example.com",
    }
    assert isinstance(result.expires_at, datetime.datetime)
    expected_expiry = datetime.datetime.now() + datetime.timedelta(
        minutes=TOKEN_EXPIRES_IN_MINUTES
    )
    assert abs((result.expires_at - expected_expiry).total_seconds()) < 1


async def test_create_ephemeral_token_invalid_token(
    httpx_mock: HTTPXMock,
    db_session: AsyncSession,
    auth_service: AuthService,
    mocker: MockerFixture,
):
    # Given
    test_url = "http://test-server/userinfo"
    mocker.patch.object(
        Settings,
        "get_user_info_url",
        new_callable=AsyncMock,
        return_value=test_url,
    )
    test_token = "invalid-token"

    httpx_mock.add_response(
        url=test_url,
        method="GET",
        status_code=401,
        match_headers={"Authorization": f"Bearer {test_token}"},
    )

    # When/Then
    with pytest.raises(InvalidTokenError):
        await auth_service.create_ephemeral_token(db_session, test_token)


async def test_consume_ephemeral_token_success(
    httpx_mock: HTTPXMock,
    db_session: AsyncSession,
    auth_service: AuthService,
    mocker: MockerFixture,
):
    # Given
    test_url = "http://test-server/userinfo"
    mocker.patch.object(
        Settings,
        "get_user_info_url",
        new_callable=AsyncMock,
        return_value=test_url,
    )
    test_token = "valid-token"

    httpx_mock.add_response(
        url=test_url,
        method="GET",
        json={
            "sub": "test-user",
            "email": "test@example.com",
        },
        match_headers={"Authorization": f"Bearer {test_token}"},
    )

    token = await auth_service.create_ephemeral_token(db_session, test_token)

    # When
    result = await auth_service.consume_ephemeral_token(
        db_session, token.ephemeral_token
    )

    # Then
    assert result is True
    # Verify token is deleted
    result = await db_session.execute(
        select(EphemeralTokenModel).filter(
            EphemeralTokenModel.ephemeral_token == token.ephemeral_token
        )
    )
    assert result.scalar_one_or_none() is None


async def test_consume_ephemeral_token_invalid_token(
    db_session: AsyncSession,
    auth_service: AuthService,
):
    # Given
    invalid_token = str(uuid.uuid4())

    # When/Then
    with pytest.raises(InvalidEphemeralTokenError):
        await auth_service.consume_ephemeral_token(db_session, invalid_token)


async def test_consume_ephemeral_token_expired(
    httpx_mock: HTTPXMock,
    db_session: AsyncSession,
    auth_service: AuthService,
    mocker: MockerFixture,
):
    # Given
    test_url = "http://test-server/userinfo"
    mocker.patch.object(
        Settings,
        "get_user_info_url",
        new_callable=AsyncMock,
        return_value=test_url,
    )
    test_token = "valid-token"

    httpx_mock.add_response(
        url=test_url,
        method="GET",
        json={
            "sub": "test-user",
            "email": "test@example.com",
        },
        match_headers={"Authorization": f"Bearer {test_token}"},
    )

    token = await auth_service.create_ephemeral_token(db_session, test_token)
    # Set token as expired
    token.expires_at = datetime.datetime.now() - datetime.timedelta(minutes=1)
    await db_session.flush()

    # When/Then
    with pytest.raises(InvalidEphemeralTokenError):
        await auth_service.consume_ephemeral_token(db_session, token.ephemeral_token)
