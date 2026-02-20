"""JD analysis models and schemas."""

from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, Field
from sqlmodel import Column, Field as SQLField, JSON, SQLModel


class JDAnalysis(SQLModel, table=True):
    """Job description analysis result: user input and AI-extracted keywords."""

    __tablename__ = "jd_analyses"

    id: int | None = SQLField(default=None, primary_key=True)
    user_id: int = SQLField(foreign_key="users.id", index=True)
    raw_text: str = SQLField()  # Extracted or pasted JD text
    file_path: str | None = SQLField(default=None, max_length=500)
    interview_date: date | None = SQLField(default=None)
    extracted_keywords: dict[str, Any] = SQLField(
        sa_column=Column(JSON), default_factory=dict
    )  # e.g. {"skills": [], "domains": []}
    created_at: datetime = SQLField(default_factory=datetime.utcnow)


class AnalysisSubmitResponse(BaseModel):
    """Response after submitting JD for analysis (bước 1). Trả về preparation_id để chuyển sang bước 2."""

    id: int
    raw_text: str
    extracted_keywords: dict[str, Any]
    created_at: datetime
    preparation_id: int

    model_config = {"from_attributes": True}
