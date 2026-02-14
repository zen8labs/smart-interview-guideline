"""User model and authentication schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlmodel import Field as SQLField, SQLModel


class User(SQLModel, table=True):
    """User database model."""

    __tablename__ = "users"

    id: int | None = SQLField(default=None, primary_key=True)
    email: str = SQLField(unique=True, index=True, max_length=255)
    hashed_password: str = SQLField(max_length=255)
    is_active: bool = SQLField(default=True)
    created_at: datetime = SQLField(default_factory=datetime.utcnow)
    updated_at: datetime = SQLField(default_factory=datetime.utcnow)


# Request/Response Schemas


class UserCreate(BaseModel):
    """Schema for user registration."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=100)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password strength requirements."""
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        return v


class UserLogin(BaseModel):
    """Schema for user login."""

    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Schema for user response (without sensitive data)."""

    id: int
    email: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    """Schema for JWT token response."""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    """Schema for token payload data."""

    user_id: int
    email: str
