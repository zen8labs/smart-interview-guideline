"""Admin API endpoints for user management."""

from datetime import datetime

from fastapi import APIRouter, HTTPException, Query, status
from sqlmodel import func, select

from app.modules.account.models import Token, User, UserResponse
from app.modules.admin.models import (
    AdminLoginRequest,
    BanUserRequest,
    UserDetailResponse,
    UserListItem,
    UserListResponse,
)
from app.utils.auth import (
    AdminUser,
    create_access_token,
    verify_password,
)
from app.utils.db import DBSession

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/login", response_model=Token)
async def admin_login(credentials: AdminLoginRequest, session: DBSession) -> Token:
    """
    Admin login endpoint.

    Args:
        credentials: Admin login credentials (email, password)
        session: Database session

    Returns:
        Token: Access token and admin user information

    Raises:
        HTTPException: If credentials are invalid or user is not admin
    """
    # Find user by email
    statement = select(User).where(User.email == credentials.email)
    result = await session.execute(statement)
    user = result.scalar_one_or_none()

    # Verify user exists and password is correct
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user is admin
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required.",
        )

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    # Update last login time
    user.updated_at = datetime.utcnow()
    session.add(user)
    await session.commit()

    # Create access token
    access_token = create_access_token(
        data={"user_id": user.id, "email": user.email, "is_admin": user.is_admin}
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/users", response_model=UserListResponse)
async def list_users(
    admin: AdminUser,
    session: DBSession,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    email: str | None = Query(None, description="Filter by email (partial match)"),
    is_active: bool | None = Query(None, description="Filter by active status"),
    is_admin: bool | None = Query(None, description="Filter by admin status"),
) -> UserListResponse:
    """
    List all users with pagination and filtering.

    Args:
        admin: Current admin user (dependency injection)
        session: Database session
        page: Page number (1-indexed)
        page_size: Number of items per page
        email: Filter by email (partial match)
        is_active: Filter by active status
        is_admin: Filter by admin status

    Returns:
        UserListResponse: Paginated list of users
    """
    # Build base query
    statement = select(User)

    # Apply filters
    if email:
        statement = statement.where(User.email.contains(email))
    if is_active is not None:
        statement = statement.where(User.is_active == is_active)
    if is_admin is not None:
        statement = statement.where(User.is_admin == is_admin)

    # Get total count
    count_statement = select(func.count()).select_from(statement.subquery())
    total_result = await session.execute(count_statement)
    total = total_result.scalar_one()

    # Apply pagination and ordering
    statement = statement.order_by(User.created_at.desc())
    statement = statement.offset((page - 1) * page_size).limit(page_size)

    # Execute query
    result = await session.execute(statement)
    users = result.scalars().all()

    return UserListResponse(
        users=[UserListItem.model_validate(user) for user in users],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/users/{user_id}", response_model=UserDetailResponse)
async def get_user_detail(
    user_id: int,
    admin: AdminUser,
    session: DBSession,
) -> UserDetailResponse:
    """
    Get detailed information about a specific user.

    Args:
        user_id: User ID
        admin: Current admin user (dependency injection)
        session: Database session

    Returns:
        UserDetailResponse: Detailed user information

    Raises:
        HTTPException: If user not found
    """
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return UserDetailResponse.model_validate(user)


@router.patch("/users/{user_id}/ban", response_model=UserDetailResponse)
async def ban_user(
    user_id: int,
    ban_request: BanUserRequest,
    admin: AdminUser,
    session: DBSession,
) -> UserDetailResponse:
    """
    Ban a user (set is_active to False).

    Args:
        user_id: User ID to ban
        ban_request: Ban request with optional reason
        admin: Current admin user (dependency injection)
        session: Database session

    Returns:
        UserDetailResponse: Updated user information

    Raises:
        HTTPException: If user not found or trying to ban themselves
    """
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Prevent admin from banning themselves
    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot ban yourself",
        )

    user.is_active = False
    user.updated_at = datetime.utcnow()
    session.add(user)
    await session.commit()
    await session.refresh(user)

    return UserDetailResponse.model_validate(user)


@router.patch("/users/{user_id}/unban", response_model=UserDetailResponse)
async def unban_user(
    user_id: int,
    admin: AdminUser,
    session: DBSession,
) -> UserDetailResponse:
    """
    Unban a user (set is_active to True).

    Args:
        user_id: User ID to unban
        admin: Current admin user (dependency injection)
        session: Database session

    Returns:
        UserDetailResponse: Updated user information

    Raises:
        HTTPException: If user not found
    """
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.is_active = True
    user.updated_at = datetime.utcnow()
    session.add(user)
    await session.commit()
    await session.refresh(user)

    return UserDetailResponse.model_validate(user)
