"""Authentication API endpoints."""

from datetime import datetime

from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from app.modules.account.models import Token, User, UserCreate, UserLogin, UserResponse
from app.utils.auth import (
    CurrentUser,
    create_access_token,
    get_password_hash,
    verify_password,
)
from app.utils.db import DBSession

router = APIRouter(prefix="/api/auth", tags=["authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, session: DBSession) -> Token:
    """
    Register a new user with email and password.

    Args:
        user_data: User registration data (email, password)
        session: Database session

    Returns:
        Token: Access token and user information

    Raises:
        HTTPException: If email already exists
    """
    # Check if email already exists
    statement = select(User).where(User.email == user_data.email)
    result = await session.execute(statement)
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Hash password and create user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        is_active=True,
    )

    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)

    # Create access token
    access_token = create_access_token(
        data={"user_id": new_user.id, "email": new_user.email}
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user),
    )


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, session: DBSession) -> Token:
    """
    Authenticate user and return access token.

    Args:
        credentials: User login credentials (email, password)
        session: Database session

    Returns:
        Token: Access token and user information

    Raises:
        HTTPException: If credentials are invalid
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
    access_token = create_access_token(data={"user_id": user.id, "email": user.email})

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/userinfo", response_model=UserResponse)
async def get_user_info(current_user: CurrentUser) -> UserResponse:
    """
    Get current authenticated user information.

    Args:
        current_user: The authenticated user (injected by dependency)

    Returns:
        UserResponse: Current user information
    """
    return UserResponse.model_validate(current_user)


@router.post("/logout")
async def logout(current_user: CurrentUser) -> dict:
    """
    Logout user (client-side token removal).

    Note: JWT tokens are stateless, so logout is handled on the client
    by removing the token from storage. This endpoint validates the token
    and can be used for logging purposes.

    Args:
        current_user: The authenticated user (injected by dependency)

    Returns:
        dict: Success message
    """
    return {"message": "Successfully logged out"}
