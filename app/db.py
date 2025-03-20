from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.settings import settings

engine = create_async_engine(
    str(settings.DATABASE_URL).replace("postgresql://", "postgresql+asyncpg://"),
    pool_size=20,
    max_overflow=10,
)
session_maker = async_sessionmaker(engine)


async def privileged_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting async session"""
    async with session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def rls_session(
    user_id: str,
) -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting async session"""
    async with session_maker() as session:
        try:
            await session.execute("SET app.user_id = :user_id", {"user_id": user_id})
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
