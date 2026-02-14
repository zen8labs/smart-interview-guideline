"""Authentication utilities for password hashing and JWT token management."""

from datetime import datetime, timedelta
from typing import Annotated

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlmodel.ext.asyncio.session import AsyncSession

from app.config import settings
from app.modules.account.models import TokenData, User
from app.utils.db import DBSession

# HTTP Bearer token scheme for FastAPI
security = HTTPBearer()


def _truncate_password(password: str) -> bytes:
    """Truncate password to 72 bytes to comply with bcrypt's limitation."""
    return password.encode("utf-8")[:72]


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.

    Args:
        plain_password: The plain text password
        hashed_password: The hashed password to compare against

    Returns:
        bool: True if password matches, False otherwise

    Note:
        bcrypt has a 72-byte limit, so passwords are truncated to 72 bytes
        using UTF-8 encoding before verification.
    """
    truncated = _truncate_password(plain_password)
    return bcrypt.checkpw(truncated, hashed_password.encode("utf-8"))


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.

    Args:
        password: The plain text password to hash

    Returns:
        str: The hashed password

    Note:
        bcrypt has a 72-byte limit, so passwords are truncated to 72 bytes
        using UTF-8 encoding before hashing.
    """
    truncated = _truncate_password(password)
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(truncated, salt).decode("utf-8")


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Create a JWT access token.

    Args:
        data: Dictionary containing the data to encode in the token
        expires_delta: Optional expiration time delta

    Returns:
        str: The encoded JWT token
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.auth.access_token_expire_minutes
        )

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.auth.jwt_secret_key, algorithm=settings.auth.jwt_algorithm
    )
    return encoded_jwt


def decode_access_token(token: str) -> TokenData:
    """
    Decode and verify a JWT access token.

    Args:
        token: The JWT token to decode

    Returns:
        TokenData: The decoded token data

    Raises:
        HTTPException: If token is invalid or expired
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token, settings.auth.jwt_secret_key, algorithms=[settings.auth.jwt_algorithm]
        )
        user_id: int = payload.get("user_id")
        email: str = payload.get("email")

        if user_id is None or email is None:
            raise credentials_exception

        return TokenData(user_id=user_id, email=email)

    except JWTError:
        raise credentials_exception


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    session: DBSession,
) -> User:
    """
    Get the current authenticated user from JWT token.

    This is a FastAPI dependency that can be used to protect routes.

    Args:
        credentials: HTTP Bearer token credentials
        session: Database session

    Returns:
        User: The authenticated user

    Raises:
        HTTPException: If authentication fails
    """
    token = credentials.credentials
    token_data = decode_access_token(token)

    user = await session.get(User, token_data.user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )

    return user


# Type alias for dependency injection
CurrentUser = Annotated[User, Depends(get_current_user)]
