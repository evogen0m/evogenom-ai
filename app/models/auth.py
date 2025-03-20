from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import mapped_column

from app.models.base import BaseModel


class EphemeralTokenModel(BaseModel):
    __tablename__ = "ephemeral_token"
    id = mapped_column(UUID, primary_key=True, server_default=func.uuid_generate_v4())
    ephemeral_token = mapped_column(String, nullable=False, unique=True)
    user_info_response = mapped_column(JSONB, nullable=False)
    expires_at = mapped_column(DateTime, nullable=False)
