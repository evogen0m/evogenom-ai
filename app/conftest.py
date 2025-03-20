import os
from pathlib import Path
from typing import AsyncGenerator

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

import app.db as db
from alembic import command
from alembic.config import Config
from app.settings import settings


@pytest.fixture(scope="session", autouse=True)
def test_settings():
    os.environ["ENV_FILE"] = ".env.test"
    # Reload the settings
    settings.__init__()
    return settings


@pytest.fixture(scope="session")
def database_migrations():
    """Run database migrations for the test session."""
    # Get the root directory of the project (where alembic.ini is located)
    root_dir = Path(__file__).parent.parent

    # Create Alembic configuration
    alembic_cfg = Config(str(root_dir / "alembic.ini"))

    # Set the SQLAlchemy URL in the Alembic configuration
    alembic_cfg.set_main_option("sqlalchemy.url", str(settings.DATABASE_URL))

    # Run all migrations
    command.upgrade(alembic_cfg, "head")


@pytest.fixture(scope="function")
async def db_session(
    database_migrations, event_loop_policy
) -> AsyncGenerator[AsyncSession, None]:
    """Create a new db session for a test."""
    async with db.session_maker() as session:
        yield session
