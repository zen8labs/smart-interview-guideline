"""JD analysis API views."""

import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.config import settings
from app.modules.analysis.models import (
    JDAnalysis,
    AnalysisSubmitResponse,
    ExtractTextResponse,
)
from app.modules.preparation.models import Preparation, PreparationStatus
from app.modules.analysis.services import (
    ALLOWED_JD_EXTENSIONS,
    LINKEDIN_JD_URL_PATTERN,
    extract_jd_content_with_llm,
    extract_keywords_with_llm,
    extract_text_from_file,
    fetch_text_from_url,
)
from app.utils.auth import CurrentUser
from app.utils.db import DBSession

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


def _ensure_jd_dir() -> Path:
    """Ensure JD upload directory exists and return it."""
    jd_path = Path(settings.storage.jd_upload_path)
    jd_path.mkdir(parents=True, exist_ok=True)
    return jd_path


@router.post("/extract-text", response_model=ExtractTextResponse)
async def extract_jd_text(
    current_user: CurrentUser,
    text: str | None = Form(None),
    file: UploadFile | None = File(None),
    linkedin_url: str | None = Form(None),
):
    """
    Chỉ trích xuất nội dung JD (text) từ: dán text, file (PDF/DOCX/TXT), hoặc LinkedIn job URL.
    Không tạo preparation hay lưu analysis. Dùng cho form đóng góp (contribution).
    """
    raw_text = ""

    if linkedin_url and linkedin_url.strip():
        if not LINKEDIN_JD_URL_PATTERN.match(linkedin_url.strip()):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid LinkedIn job URL. Example: https://www.linkedin.com/jobs/view/4375191000/",
            )
        raw_text = await fetch_text_from_url(linkedin_url.strip())
        if not raw_text or len(raw_text) < 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not extract enough text from the URL (page may require login or block access). Try pasting the JD text instead.",
            )
        raw_text = await extract_jd_content_with_llm(raw_text, source="linkedin")
    elif file and file.filename:
        ext = Path(file.filename).suffix.lower()
        if ext not in ALLOWED_JD_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Allowed file types: {', '.join(ALLOWED_JD_EXTENSIONS)}",
            )
        content = await file.read()
        raw_text = extract_text_from_file(content=content, filename=file.filename)
        if not raw_text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not extract text from the uploaded file",
            )
        raw_text = await extract_jd_content_with_llm(raw_text, source="file")
    elif text and text.strip():
        raw_text = text.strip()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide 'text', 'file', or 'linkedin_url' (job description content)",
        )

    return ExtractTextResponse(raw_text=raw_text)


@router.post("/submit")
async def submit_jd_analysis(
    session: DBSession,
    current_user: CurrentUser,
    text: str | None = Form(None),
    file: UploadFile | None = File(None),
    linkedin_url: str | None = Form(None),
):
    """
    Submit a job description via pasted text, file upload, or LinkedIn job URL.
    AI extracts keywords (skills, domains).
    """
    raw_text = ""
    file_path = None

    if linkedin_url and linkedin_url.strip():
        if not LINKEDIN_JD_URL_PATTERN.match(linkedin_url.strip()):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid LinkedIn job URL. Example: https://www.linkedin.com/jobs/view/4375191000/",
            )
        raw_text = await fetch_text_from_url(linkedin_url.strip())
        if not raw_text or len(raw_text) < 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not extract enough text from the URL (page may require login or block access). Try pasting the JD text instead.",
            )
    elif file and file.filename:
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Filename is required when uploading a file",
            )
        ext = Path(file.filename).suffix.lower()
        if ext not in ALLOWED_JD_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Allowed file types: {', '.join(ALLOWED_JD_EXTENSIONS)}",
            )
        content = await file.read()
        raw_text = extract_text_from_file(content=content, filename=file.filename)
        if not raw_text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not extract text from the uploaded file",
            )
        # Save file for reference
        jd_dir = _ensure_jd_dir()
        user_dir = jd_dir / str(current_user.id)
        user_dir.mkdir(parents=True, exist_ok=True)
        safe_name = f"{uuid.uuid4().hex}_{Path(file.filename).name}"
        save_path = user_dir / safe_name
        save_path.write_bytes(content)
        file_path = str(save_path.relative_to(Path(settings.storage.upload_dir)))
    elif text and text.strip():
        raw_text = text.strip()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide 'text', 'file', or 'linkedin_url' (job description content)",
        )

    user_profile: dict[str, Any] = {}
    if current_user.role:
        user_profile["role"] = current_user.role
    if current_user.experience_years is not None:
        user_profile["experience_years"] = current_user.experience_years
    if current_user.skills_summary:
        user_profile["skills_summary"] = current_user.skills_summary
    if current_user.current_company:
        user_profile["current_company"] = current_user.current_company

    keywords = await extract_keywords_with_llm(
        raw_text,
        preferred_language=current_user.preferred_language,
        user_profile=user_profile if user_profile else None,
    )

    analysis = JDAnalysis(
        user_id=current_user.id,
        raw_text=raw_text,
        file_path=file_path,
        interview_date=None,
        extracted_keywords=keywords,
    )
    session.add(analysis)
    await session.commit()
    await session.refresh(analysis)

    # Bước 1 xong: tạo Preparation (không tạo roadmap; roadmap tạo sau memory scan)
    prep = Preparation(
        user_id=current_user.id,
        jd_analysis_id=analysis.id,
        status=PreparationStatus.MEMORY_SCAN_READY,
    )
    session.add(prep)
    await session.commit()
    await session.refresh(prep)

    return AnalysisSubmitResponse(
        id=analysis.id,
        raw_text=analysis.raw_text,
        extracted_keywords=analysis.extracted_keywords,
        created_at=analysis.created_at,
        preparation_id=prep.id,
    )
