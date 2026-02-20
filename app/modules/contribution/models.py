"""Contribution model: đóng góp thông tin phỏng vấn sau khi phỏng vấn."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field
from sqlmodel import Column, Field as SQLField, JSON, SQLModel


class ContributionStatus:
    """Trạng thái kiểm duyệt đóng góp."""

    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class Contribution(SQLModel, table=True):
    """
    Đóng góp của user sau phỏng vấn: JD, công ty, câu hỏi, câu trả lời.
    Có thể gắn với một preparation (nếu user đã chuẩn bị bằng preparation đó).
    Cần được admin duyệt (status: pending → approved/rejected).
    """

    __tablename__ = "contributions"

    id: int | None = SQLField(default=None, primary_key=True)
    user_id: int = SQLField(foreign_key="users.id", index=True)
    company_id: int = SQLField(foreign_key="companies.id", index=True)
    preparation_id: int | None = SQLField(default=None, foreign_key="preparations.id", index=True)

    # Vị trí tuyển dụng (vd: Backend Engineer, Frontend Dev)
    job_position: str | None = SQLField(default=None, max_length=255)
    # JD của cuộc phỏng vấn
    jd_content: str = SQLField()
    # Thông tin câu hỏi: list of {"question_text": "...", "question_type": "..."}
    question_info: list[dict[str, Any]] = SQLField(sa_column=Column(JSON), default_factory=list)
    # Câu trả lời / phản hồi của ứng viên hoặc người phỏng vấn (nếu có)
    candidate_responses: str | None = SQLField(default=None)

    # Kiểm duyệt bởi admin
    status: str = SQLField(
        max_length=20, default=ContributionStatus.PENDING, index=True
    )
    approved_by_admin_id: int | None = SQLField(
        default=None, foreign_key="users.id", index=True
    )
    approved_at: datetime | None = SQLField(default=None)

    created_at: datetime = SQLField(default_factory=datetime.utcnow)
    updated_at: datetime = SQLField(default_factory=datetime.utcnow)


class ContributionCreate(BaseModel):
    """Schema tạo contribution."""

    company_id: int = Field(..., description="ID công ty (tạo trước hoặc chọn từ list)")
    preparation_id: int | None = Field(None, description="Gắn với preparation (tùy chọn)")
    job_position: str | None = Field(None, max_length=255, description="Vị trí tuyển dụng")
    jd_content: str = Field(..., min_length=1, description="JD cuộc phỏng vấn")
    question_info: list[dict[str, Any]] = Field(
        default_factory=list,
        description="Danh sách câu hỏi: [{question_text, question_type?}, ...]",
    )
    candidate_responses: str | None = Field(
        None,
        description="Câu trả lời / phản hồi của ứng viên hoặc người phỏng vấn",
    )


class ContributionResponse(BaseModel):
    """Contribution cho API response."""

    id: int
    user_id: int
    company_id: int
    preparation_id: int | None
    job_position: str | None
    jd_content: str
    question_info: list[dict[str, Any]]
    candidate_responses: str | None
    status: str
    approved_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ContributionWithCompanyResponse(ContributionResponse):
    """Contribution + tên công ty (cho list)."""

    company_name: str = ""


class ContributionAdminListResponse(ContributionWithCompanyResponse):
    """Contribution cho admin list: thêm email người đóng góp."""

    user_email: str = ""
