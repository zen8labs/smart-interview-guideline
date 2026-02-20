"""Contribution API: tạo và liệt kê đóng góp của user."""

from fastapi import APIRouter, HTTPException, Query, status
from sqlmodel import select

from app.modules.company.models import Company
from app.modules.contribution.models import (
    Contribution,
    ContributionCreate,
    ContributionResponse,
    ContributionWithCompanyResponse,
)
from app.modules.preparation.models import Preparation
from app.utils.auth import CurrentUser
from app.utils.db import DBSession

router = APIRouter(prefix="/api/contributions", tags=["contributions"])


@router.post("", response_model=ContributionResponse, status_code=status.HTTP_201_CREATED)
async def create_contribution(
    body: ContributionCreate,
    session: DBSession,
    current_user: CurrentUser,
):
    """
    Đóng góp thông tin phỏng vấn: JD, công ty, câu hỏi, câu trả lời.
    Có thể gắn với một preparation (phải thuộc user).
    """
    company = await session.get(Company, body.company_id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )

    preparation_id = body.preparation_id
    if preparation_id is not None:
        prep = await session.get(Preparation, preparation_id)
        if not prep or prep.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Preparation not found or not yours",
            )

    contribution = Contribution(
        user_id=current_user.id,
        company_id=body.company_id,
        preparation_id=preparation_id,
        job_position=(body.job_position or "").strip() or None,
        jd_content=body.jd_content.strip(),
        question_info=body.question_info or [],
        candidate_responses=body.candidate_responses.strip() or None,
    )
    session.add(contribution)
    await session.commit()
    await session.refresh(contribution)
    return ContributionResponse.model_validate(contribution)


@router.get("", response_model=list[ContributionWithCompanyResponse])
async def list_my_contributions(
    session: DBSession,
    current_user: CurrentUser,
    preparation_id: int | None = Query(None, description="Lọc theo preparation"),
    limit: int = Query(50, ge=1, le=100),
):
    """
    Danh sách đóng góp của user (mới nhất trước).
    Có thể lọc theo preparation_id. Trả về kèm tên công ty.
    """
    stmt = (
        select(Contribution)
        .where(Contribution.user_id == current_user.id)
        .order_by(Contribution.created_at.desc())
        .limit(limit)
    )
    if preparation_id is not None:
        stmt = stmt.where(Contribution.preparation_id == preparation_id)
    result = await session.exec(stmt)
    items = result.all()
    out = []
    for c in items:
        company = await session.get(Company, c.company_id)
        data = ContributionWithCompanyResponse(
            **ContributionResponse.model_validate(c).model_dump(),
            company_name=company.name if company else "",
        )
        out.append(data)
    return out


@router.get("/{contribution_id}", response_model=ContributionResponse)
async def get_contribution(
    contribution_id: int,
    session: DBSession,
    current_user: CurrentUser,
):
    """Lấy chi tiết một contribution (chỉ của user)."""
    contribution = await session.get(Contribution, contribution_id)
    if not contribution or contribution.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contribution not found",
        )
    return ContributionResponse.model_validate(contribution)
