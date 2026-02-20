"""Roadmap and daily task models."""

from datetime import date, datetime
from typing import Any

from pydantic import BaseModel
from sqlmodel import Column, Field as SQLField, JSON, SQLModel


class Roadmap(SQLModel, table=True):
    """User's learning roadmap; tạo sau khi user hoàn thành memory scan (bước 3)."""

    __tablename__ = "roadmaps"

    id: int | None = SQLField(default=None, primary_key=True)
    user_id: int = SQLField(foreign_key="users.id", index=True)
    preparation_id: int | None = SQLField(
        default=None, foreign_key="preparations.id", index=True
    )
    jd_analysis_id: int | None = SQLField(
        default=None, foreign_key="jd_analyses.id", index=True
    )
    interview_date: date | None = SQLField(default=None)
    created_at: datetime = SQLField(default_factory=datetime.utcnow)


class DailyTask(SQLModel, table=True):
    """A single task in the roadmap (learning card)."""

    __tablename__ = "daily_tasks"

    id: int | None = SQLField(default=None, primary_key=True)
    roadmap_id: int = SQLField(foreign_key="roadmaps.id", index=True)
    day_index: int = SQLField(default=0, index=True)  # 0 = first day
    title: str = SQLField(max_length=255)
    content: str = SQLField()  # Markdown or plain text
    content_type: str = SQLField(
        max_length=50, default="text", index=True
    )  # text | image | video
    knowledge_id: int | None = SQLField(default=None, foreign_key="knowledge.id")
    sort_order: int = SQLField(default=0, index=True)
    is_completed: bool = SQLField(default=False, index=True)
    completed_at: datetime | None = SQLField(default=None)
    meta: dict[str, Any] = SQLField(sa_column=Column(JSON), default_factory=dict)
    created_at: datetime = SQLField(default_factory=datetime.utcnow)


class DailyTaskResponse(BaseModel):
    """Daily task for API response (có thể có meta: ảnh, link tham khảo)."""

    id: int
    roadmap_id: int
    day_index: int
    title: str
    content: str
    content_type: str
    knowledge_id: int | None
    sort_order: int
    is_completed: bool
    completed_at: datetime | None
    created_at: datetime
    meta: dict[str, Any] = {}

    model_config = {"from_attributes": True}


class DailyRoadmapResponse(BaseModel):
    """Daily roadmap: list of tasks for today."""

    roadmap_id: int
    day_index: int
    tasks: list[DailyTaskResponse]
