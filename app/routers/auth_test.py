import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.services.auth import AuthService

from .auth import router


@pytest.fixture
def app():
    app = FastAPI()
    app.include_router(router)
    return app


@pytest.fixture
def client(app):
    return TestClient(app)


@pytest.fixture
def mock_auth_service(mocker):
    return mocker.Mock(spec=AuthService)


@pytest.fixture
def mock_auth_service_dependency(app, mock_auth_service):
    app.dependency_overrides = {AuthService: lambda: mock_auth_service}
    yield mock_auth_service
    app.dependency_overrides = {}


def test_get_ephemeral_token_success(client, mock_auth_service_dependency):
    # Arrange
    expected_token = "test_token_123"
    mock_auth_service_dependency.create_ephemeral_token.return_value = expected_token

    # Act
    response = client.post(
        "/auth/token", headers={"Authorization": "Bearer test_bearer_token"}
    )

    # Assert
    assert response.status_code == 200
    assert response.json() == {"token": expected_token}
    mock_auth_service_dependency.create_ephemeral_token.assert_called_once_with(
        "test_bearer_token"
    )


def test_get_ephemeral_token_failure(client, mock_auth_service_dependency):
    # Arrange
    mock_auth_service_dependency.create_ephemeral_token.return_value = None

    # Act
    response = client.post(
        "/auth/token", headers={"Authorization": "Bearer invalid_token"}
    )

    # Assert
    assert response.status_code == 401
    assert response.json() == {"detail": "Could not generate ephemeral token"}
    mock_auth_service_dependency.create_ephemeral_token.assert_called_once_with(
        "invalid_token"
    )


def test_get_ephemeral_token_missing_auth_header(client):
    # Act
    response = client.post("/auth/token")

    # Assert
    assert response.status_code == 403
    assert response.json() == {"detail": "Not authenticated"}
