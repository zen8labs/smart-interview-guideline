"""Preparation model: một lần chuẩn bị phỏng vấn (4 bước)."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel
from sqlmodel import Column, Field as SQLField, JSON, SQLModel


class PreparationStatus:
    """Trạng thái theo từng bước trong luồng 4 bước."""

    JD_PENDING = "jd_pending"  # Đã tạo preparation, chưa có JD
    JD_DONE = "jd_done"  # Bước 1 xong
    MEMORY_SCAN_READY = "memory_scan_ready"  # Sẵn sàng làm memory scan
    MEMORY_SCAN_DONE = "memory_scan_done"  # Bước 2 xong (đã trả lời)
    ROADMAP_READY = "roadmap_ready"  # Bước 3 xong (đã có roadmap)
    SELF_CHECK_READY = "self_check_ready"  # Bước 4: có câu hỏi self-check


class Preparation(SQLModel, table=True):
    """
    Một lần preparation: JD → bộ câu hỏi memory scan (JSON) → user trả lời → roadmap → self-check questions.
    Bộ câu hỏi memory scan được JSON hoá và gắn với preparation này.
    """

    __tablename__ = "preparations"

    id: int | None = SQLField(default=None, primary_key=True)
    user_id: int = SQLField(foreign_key="users.id", index=True)
    jd_analysis_id: int = SQLField(foreign_key="jd_analyses.id", index=True)
    status: str = SQLField(max_length=50, default=PreparationStatus.MEMORY_SCAN_READY, index=True)

    # Vùng kiến thức xác định từ JD + profile (trước memory scan); dùng thống nhất cho memory scan, roadmap, self-check
    knowledge_areas: list[str] = SQLField(sa_column=Column(JSON), default_factory=list)

    # Bước 2: Bộ câu hỏi memory scan (từ warehouse hoặc AI), mỗi câu có thể có "knowledge_area" index/name
    memory_scan_questions: list[dict[str, Any]] = SQLField(
        sa_column=Column(JSON), default_factory=list
    )

    # Bước 3: Roadmap tạo sau khi user chọn "Tiếp tục tạo roadmap"
    roadmap_id: int | None = SQLField(default=None, foreign_key="roadmaps.id", index=True)

    # Kết quả memory scan lần cuối (để user xem lại và quyết định tạo roadmap hay làm lại)
    last_memory_scan_result: dict[str, Any] | None = SQLField(
        sa_column=Column(JSON), default=None
    )

    # Bước 4: Bộ câu hỏi self-check (có thể lưu snapshot hoặc lấy theo roadmap)
    self_check_question_ids: list[int] = SQLField(
        sa_column=Column(JSON), default_factory=list
    )

    created_at: datetime = SQLField(default_factory=datetime.utcnow)
    updated_at: datetime = SQLField(default_factory=datetime.utcnow)


class PreparationResponse(BaseModel):
    """Preparation cho API response."""

    id: int
    user_id: int
    jd_analysis_id: int
    status: str
    roadmap_id: int | None
    knowledge_areas: list[str] = []
    last_memory_scan_result: dict[str, Any] | None = None
    created_at: datetime
    # Từ JD analysis (meta), có khi list preparations
    company_name: str | None = None
    job_title: str | None = None

    model_config = {"from_attributes": True}


class MemoryScanQuestionDisplay(BaseModel):
    """Một câu hỏi memory scan (không có correct_answer khi trả về client)."""

    id: str  # index hoặc temp id trong bộ câu
    question_text: str
    question_type: str
    options: dict[str, Any]


class SelfCheckQuestionDisplay(BaseModel):
    """Câu hỏi giả lập phỏng vấn (self-check): chỉ nội dung câu hỏi, không có lựa chọn/chấm điểm."""

    id: str
    question_text: str


class MemoryScanSubmitRequest(BaseModel):
    """Request nộp đáp án memory scan."""

    answers: list[dict[str, Any]]  # [ {"question_id": "0", "selected_answer": "A" }, ... ]
