"""Company API: list, create, get by id (cho contribution và preparation)."""

from fastapi import APIRouter, HTTPException, Query, status
from sqlmodel import col, select

from app.modules.company.models import Company, CompanyCreate, CompanyResponse
from app.utils.auth import CurrentUser
from app.utils.db import DBSession

router = APIRouter(prefix="/api/companies", tags=["companies"])


@router.get("", response_model=list[CompanyResponse])
async def list_companies(
    session: DBSession,
    current_user: CurrentUser,
    q: str | None = Query(None, description="Search by name"),
    limit: int = Query(50, ge=1, le=100),
):
    """
    Danh sách công ty (có thể tìm theo tên).
    Dùng cho dropdown khi đóng góp hoặc truy vấn thông tin preparation.
    """
    stmt = select(Company).order_by(Company.name)
    if q and q.strip():
        stmt = stmt.where(col(Company.name).ilike(f"%{q.strip()}%"))
    stmt = stmt.limit(limit)
    result = await session.exec(stmt)
    return [CompanyResponse.model_validate(c) for c in result.all()]


@router.post("", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_company(
    body: CompanyCreate,
    session: DBSession,
    current_user: CurrentUser,
):
    """Tạo công ty mới (khi user đóng góp với tên công ty chưa có)."""
    name = body.name.strip()
    existing = await session.exec(select(Company).where(Company.name == name))
    if existing.first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company with this name already exists",
        )
    company = Company(name=name)
    session.add(company)
    await session.commit()
    await session.refresh(company)
    return CompanyResponse.model_validate(company)


@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(
    company_id: int,
    session: DBSession,
    current_user: CurrentUser,
):
    """Lấy thông tin một công ty theo id."""
    company = await session.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    return CompanyResponse.model_validate(company)
