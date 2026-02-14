"""Admin-specific models and schemas."""

from datetime import datetime

from pydantic import BaseModel


class UserListItem(BaseModel):
    """Schema for user in list view."""

    id: int
    email: str
    is_active: bool
    is_admin: bool
    role: str | None = None
    experience_years: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserDetailResponse(BaseModel):
    """Schema for detailed user information (admin view)."""

    id: int
    email: str
    is_active: bool
    is_admin: bool
    role: str | None = None
    experience_years: int | None = None
    cv_path: str | None = None
    cv_filename: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    """Schema for paginated user list."""

    users: list[UserListItem]
    total: int
    page: int
    page_size: int


class BanUserRequest(BaseModel):
    """Schema for banning a user."""

    reason: str | None = None


class AdminLoginRequest(BaseModel):
    """Schema for admin login."""

    email: str
    password: str
