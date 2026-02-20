"""Profile management and CV upload API endpoints."""

import logging
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from app.config import settings
from app.modules.account.models import ProfileUpdate, User, UserResponse, UserRole
from app.modules.account.profile_services import extract_profile_from_cv_llm
from app.modules.analysis.services import extract_text_from_file
from app.utils.auth import CurrentUser
from app.utils.db import DBSession

logger = logging.getLogger(__name__)

profile_router = APIRouter(prefix="/api/user", tags=["profile"])


def _ensure_cv_dir(user_id: int) -> Path:
    """Ensure the CV upload directory exists for a user and return it."""
    cv_dir = Path(settings.storage.cv_upload_path) / str(user_id)
    cv_dir.mkdir(parents=True, exist_ok=True)
    return cv_dir


def _validate_cv_file(file: UploadFile) -> str:
    """
    Validate the uploaded CV file extension and content type.

    Returns the lowercase file extension (e.g. '.pdf').

    Raises:
        HTTPException: If the file type is not allowed.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required",
        )

    ext = Path(file.filename).suffix.lower()
    allowed = settings.storage.allowed_cv_extensions

    if ext not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{ext}' is not allowed. Allowed types: {', '.join(allowed)}",
        )

    return ext


@profile_router.patch("/profile", response_model=UserResponse)
async def update_profile(
    profile_data: ProfileUpdate,
    current_user: CurrentUser,
    session: DBSession,
) -> UserResponse:
    """
    Update the current user's profile (name, contact, role, experience, etc.).

    Args:
        profile_data: Profile fields to update
        current_user: The authenticated user
        session: Database session

    Returns:
        UserResponse: Updated user information
    """
    update_dict = profile_data.model_dump(exclude_unset=True)

    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    # Convert enum to string value for storage
    if "role" in update_dict and update_dict["role"] is not None:
        update_dict["role"] = update_dict["role"].value if isinstance(
            update_dict["role"], UserRole
        ) else update_dict["role"]

    for field, value in update_dict.items():
        setattr(current_user, field, value)

    current_user.updated_at = datetime.utcnow()
    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)

    return UserResponse.model_validate(current_user)


@profile_router.post("/cv", response_model=UserResponse)
async def upload_cv(
    file: UploadFile,
    current_user: CurrentUser,
    session: DBSession,
) -> UserResponse:
    """
    Upload a CV file for the current user.

    Accepts PDF, DOCX, or TXT files up to the configured max size.
    Replaces any previously uploaded CV.

    Args:
        file: The uploaded CV file
        current_user: The authenticated user
        session: Database session

    Returns:
        UserResponse: Updated user information with cv_filename
    """
    # Validate file type
    ext = _validate_cv_file(file)

    # Read file content and check size
    content = await file.read()
    max_size = settings.storage.max_cv_size_bytes

    if len(content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {settings.storage.max_cv_size_mb} MB",
        )

    # Generate a unique filename: {uuid}_{sanitized_original_name}
    safe_original = "".join(
        c if c.isalnum() or c in ".-_" else "_"
        for c in Path(file.filename).stem
    )
    unique_name = f"{uuid.uuid4().hex}_{safe_original}{ext}"

    # Ensure user CV directory exists
    cv_dir = _ensure_cv_dir(current_user.id)
    file_path = cv_dir / unique_name

    # Delete old CV file if it exists
    if current_user.cv_path:
        old_path = Path(settings.storage.cv_upload_path) / current_user.cv_path
        if old_path.exists():
            try:
                old_path.unlink()
                logger.info(f"Deleted old CV for user {current_user.id}: {old_path}")
            except OSError as e:
                logger.warning(f"Failed to delete old CV: {e}")

    # Write the new file
    try:
        file_path.write_bytes(content)
    except OSError as e:
        logger.error(f"Failed to save CV file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save file",
        )

    # Store relative path (relative to cv_upload_path): {user_id}/{unique_name}
    relative_path = f"{current_user.id}/{unique_name}"
    current_user.cv_path = relative_path
    current_user.updated_at = datetime.utcnow()

    # Extract profile from CV using LLM and auto-fill user fields
    try:
        cv_text = extract_text_from_file(content=content, filename=file.filename or "")
        if cv_text and cv_text.strip():
            extracted = await extract_profile_from_cv_llm(cv_text)
            profile_fields = (
                "full_name",
                "phone",
                "linkedin_url",
                "current_company",
                "skills_summary",
                "education_summary",
                "role",
                "experience_years",
            )
            for key in profile_fields:
                value = extracted.get(key)
                if value is not None and (value != "" if isinstance(value, str) else True):
                    setattr(current_user, key, value)
            if extracted:
                logger.info(
                    "CV profile extracted and applied for user %s: %s",
                    current_user.id,
                    list(extracted.keys()),
                )
    except Exception as e:
        logger.warning("CV profile extraction failed (upload succeeded): %s", e)

    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)

    logger.info(f"CV uploaded for user {current_user.id}: {relative_path}")
    return UserResponse.model_validate(current_user)


@profile_router.get("/cv")
async def download_cv(current_user: CurrentUser) -> FileResponse:
    """
    Download the current user's CV file.

    Args:
        current_user: The authenticated user

    Returns:
        FileResponse: The CV file as a download

    Raises:
        HTTPException: If no CV has been uploaded
    """
    if not current_user.cv_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No CV uploaded",
        )

    file_path = Path(settings.storage.cv_upload_path) / current_user.cv_path

    # Security: ensure resolved path is inside the upload directory
    try:
        file_path.resolve().relative_to(Path(settings.storage.cv_upload_path).resolve())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CV file not found on disk",
        )

    # Determine content type from extension
    ext = file_path.suffix.lower()
    content_type_map = {
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".txt": "text/plain",
    }
    media_type = content_type_map.get(ext, "application/octet-stream")

    # Use the original filename (strip uuid prefix) for the download
    filename = current_user.cv_filename or file_path.name

    return FileResponse(
        path=str(file_path),
        media_type=media_type,
        filename=filename,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@profile_router.delete("/cv", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cv(
    current_user: CurrentUser,
    session: DBSession,
) -> None:
    """
    Delete the current user's CV file.

    Args:
        current_user: The authenticated user
        session: Database session
    """
    if not current_user.cv_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No CV uploaded",
        )

    file_path = Path(settings.storage.cv_upload_path) / current_user.cv_path
    if file_path.exists():
        try:
            file_path.unlink()
            logger.info(f"Deleted CV for user {current_user.id}: {file_path}")
        except OSError as e:
            logger.warning(f"Failed to delete CV file: {e}")

    current_user.cv_path = None
    current_user.updated_at = datetime.utcnow()
    session.add(current_user)
    await session.commit()
