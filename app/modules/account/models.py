"""User model and authentication schemas."""

import enum
from datetime import datetime
from pathlib import Path
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlmodel import Field as SQLField, SQLModel


class UserRole(str, enum.Enum):
    """Allowed user roles."""

    BACKEND = "backend"
    FRONTEND = "frontend"
    FULLSTACK = "fullstack"
    TESTER = "tester"
    BA = "ba"
    DEVOPS = "devops"
    DATA = "data"
    MOBILE = "mobile"


class User(SQLModel, table=True):
    """User database model."""

    __tablename__ = "users"

    id: int | None = SQLField(default=None, primary_key=True)
    email: str = SQLField(unique=True, index=True, max_length=255)
    hashed_password: str = SQLField(max_length=255)
    is_active: bool = SQLField(default=True)
    is_admin: bool = SQLField(default=False)

    # Profile fields
    full_name: str | None = SQLField(default=None, max_length=255)
    phone: str | None = SQLField(default=None, max_length=50)
    linkedin_url: str | None = SQLField(default=None, max_length=500)
    current_company: str | None = SQLField(default=None, max_length=255)
    skills_summary: str | None = SQLField(default=None)
    education_summary: str | None = SQLField(default=None)
    role: str | None = SQLField(default=None, max_length=50)
    experience_years: int | None = SQLField(default=None)
    cv_path: str | None = SQLField(default=None, max_length=500)

    created_at: datetime = SQLField(default_factory=datetime.utcnow)
    updated_at: datetime = SQLField(default_factory=datetime.utcnow)

    @property
    def cv_filename(self) -> str | None:
        """Extract the original filename from cv_path (uuid_originalname.ext)."""
        if not self.cv_path:
            return None
        name = Path(self.cv_path).name
        # Strip the uuid prefix (first 33 chars: 32 hex + underscore)
        if len(name) > 33 and name[32] == "_":
            return name[33:]
        return name


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
    is_admin: bool = False
    full_name: str | None = None
    phone: str | None = None
    linkedin_url: str | None = None
    current_company: str | None = None
    skills_summary: str | None = None
    education_summary: str | None = None
    role: str | None = None
    experience_years: int | None = None
    cv_filename: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ProfileUpdate(BaseModel):
    """Schema for updating user profile."""

    full_name: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=50)
    linkedin_url: str | None = Field(default=None, max_length=500)
    current_company: str | None = Field(default=None, max_length=255)
    skills_summary: str | None = None
    education_summary: str | None = None
    role: UserRole | None = None
    experience_years: int | None = Field(default=None, ge=0, le=50)


class Token(BaseModel):
    """Schema for JWT token response (login/register)."""

    access_token: str
    token_type: str = "bearer"
    refresh_token: str | None = None
    user: UserResponse


class RefreshResponse(BaseModel):
    """Schema for refresh token response."""

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema for token payload data."""

    user_id: int
    email: str
