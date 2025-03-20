from sqlalchemy import DDL, DateTime, String, event
from sqlalchemy.orm import DeclarativeBase, mapped_column
from sqlalchemy.sql import func


class BaseModel(DeclarativeBase):
    __abstract__ = True
    created_at = mapped_column(DateTime, server_default=func.now())
    updated_at = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class UserOwnedBaseModel(BaseModel):
    __abstract__ = True
    user_id = mapped_column(String, nullable=False)
