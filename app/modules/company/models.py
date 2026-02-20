"""Company model: công ty dùng để truy vấn thông tin hữu ích cho preparation."""

from datetime import datetime

from pydantic import BaseModel, Field
from sqlmodel import Field as SQLField, SQLModel


class Company(SQLModel, table=True):
    """
    Công ty: dùng để gắn với contribution và truy vấn thông tin hữu ích
    cho các preparation về sau (ví dụ câu hỏi phỏng vấn theo công ty).
    """

    __tablename__ = "companies"

    id: int | None = SQLField(default=None, primary_key=True)
    name: str = SQLField(max_length=255, index=True)
    created_at: datetime = SQLField(default_factory=datetime.utcnow)


class CompanyCreate(BaseModel):
    """Schema tạo công ty (tên)."""

    name: str = Field(min_length=1, max_length=255)


class CompanyResponse(BaseModel):
    """Company cho API response."""

    id: int
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}
