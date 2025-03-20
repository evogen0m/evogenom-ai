import os

import cachetools
import httpx
from pydantic import PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application Settings
    APP_NAME: str = "EvogenomAI"
    DEBUG: bool = False

    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database Settings
    DATABASE_URL: PostgresDsn

    # CORS Settings
    CORS_ORIGINS: list[str] = ["*"]
    CORS_METHODS: list[str] = ["*"]
    CORS_HEADERS: list[str] = ["*"]

    OPENID_CONFIG_URL: str

    model_config = SettingsConfigDict(
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
        env_file=os.environ.get("ENV_FILE", ".env"),
    )

    @cachetools.cached(
        cache=cachetools.TTLCache(ttl=300, maxsize=1),
        key=lambda self: self.OPENID_CONFIG_URL,
    )
    async def get_user_info_url(self) -> str:
        """Fetch the OpenID configuration and extract the userinfo_endpoint."""
        async with httpx.AsyncClient() as client:
            response = await client.get(self.OPENID_CONFIG_URL)
            config = response.json()
            return config["userinfo_endpoint"]


settings = Settings()
