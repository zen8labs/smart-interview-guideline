"""Preparation API: luồng 4 bước (JD → Memory Scan → Roadmap → Self-check)."""

from copy import deepcopy
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query, status
from sqlmodel import select

from app.modules.account.models import User
from app.modules.analysis.models import JDAnalysis, AnalysisSubmitResponse
from app.modules.analysis.services import normalize_extracted_keyword_names
from app.modules.preparation.models import (
    MemoryScanQuestionDisplay,
    MemoryScanSubmitRequest,
    Preparation,
    PreparationResponse,
    PreparationStatus,
    SelfCheckQuestionDisplay,
)
from app.modules.preparation.services import (
    create_roadmap_after_memory_scan,
    generate_questions_with_ai,
    generate_self_check_questions,
    get_questions_from_warehouse,
    _score_memory_scan_answers,
)
from app.modules.questions.models import AssessmentSession, UserQuestionAnswer
from app.modules.roadmap.models import DailyTask, DailyTaskResponse
from app.utils.auth import CurrentUser
from app.utils.db import DBSession

router = APIRouter(prefix="/api/preparations", tags=["preparation"])


def _questions_for_display(questions: list[dict]) -> list[MemoryScanQuestionDisplay]:
    """Bỏ correct_answer khi trả về client."""
    out = []
    for q in questions:
        opts = deepcopy(q.get("options") or {})
        opts.pop("correct_answer", None)
        opts.pop("correct_index", None)
        out.append(
            MemoryScanQuestionDisplay(
                id=str(q.get("id", "")),
                question_text=q.get("question_text", ""),
                question_type=q.get("question_type", "multiple_choice"),
                options=opts,
            )
        )
    return out


@router.get("/{preparation_id}/jd-analysis", response_model=AnalysisSubmitResponse)
async def get_preparation_jd_analysis(
    preparation_id: int,
    session: DBSession,
    current_user: CurrentUser,
):
    """Xem lại kết quả phân tích JD của preparation (bước 1)."""
    prep = await session.get(Preparation, preparation_id)
    if not prep or prep.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preparation not found")
    jd = await session.get(JDAnalysis, prep.jd_analysis_id)
    if not jd:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="JD analysis not found")
    return AnalysisSubmitResponse(
        id=jd.id,
        raw_text=jd.raw_text,
        extracted_keywords=jd.extracted_keywords or {},
        created_at=jd.created_at,
        preparation_id=prep.id,
    )


@router.get("/{preparation_id}", response_model=PreparationResponse)
async def get_preparation(
    preparation_id: int,
    session: DBSession,
    current_user: CurrentUser,
) -> Preparation:
    """Lấy thông tin một preparation (phải thuộc user)."""
    prep = await session.get(Preparation, preparation_id)
    if not prep or prep.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preparation not found")
    return prep


@router.get("/{preparation_id}/memory-scan-questions")
async def get_memory_scan_questions(
    preparation_id: int,
    session: DBSession,
    current_user: CurrentUser,
    source: str = Query("auto", description="warehouse | ai | auto"),
) -> list[MemoryScanQuestionDisplay]:
    """
    Bước 2: Lấy bộ câu hỏi memory scan cho preparation.
    Nếu chưa có thì tạo: từ question warehouse hoặc AI (theo source).
    Bộ câu hỏi được lưu JSON vào preparation.
    """
    prep = await session.get(Preparation, preparation_id)
    if not prep or prep.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preparation not found")

    jd = await session.get(JDAnalysis, prep.jd_analysis_id)
    if not jd:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="JD analysis not found")

    keywords = jd.extracted_keywords or {}
    skills, _, keywords_list = normalize_extracted_keyword_names(keywords)
    tags = list(keywords_list) + list(skills)

    if prep.memory_scan_questions:
        return _questions_for_display(prep.memory_scan_questions)

    if source == "warehouse":
        questions = await get_questions_from_warehouse(
            session, skills=skills, tags=tags, limit=8
        )
    elif source == "ai":
        questions = await generate_questions_with_ai(
            session,
            jd_analysis=jd,
            user_role=current_user.role,
            limit=8,
        )
    else:
        questions = await get_questions_from_warehouse(
            session, skills=skills, tags=tags, limit=8
        )
        if len(questions) < 5:
            questions = await generate_questions_with_ai(
                session,
                jd_analysis=jd,
                user_role=current_user.role,
                limit=8,
            )

    if not questions:
        questions = await generate_questions_with_ai(
            session,
            jd_analysis=jd,
            user_role=current_user.role,
            limit=8,
        )

    prep.memory_scan_questions = questions
    prep.updated_at = datetime.utcnow()
    session.add(prep)
    await session.commit()

    return _questions_for_display(questions)


@router.post("/{preparation_id}/memory-scan/submit")
async def submit_memory_scan(
    preparation_id: int,
    body: MemoryScanSubmitRequest,
    session: DBSession,
    current_user: CurrentUser,
):
    """
    Bước 2 (kết): Nộp đáp án memory scan.
    Sau khi chấm điểm, tạo roadmap (bước 3) và gắn với preparation.
    """
    prep = await session.get(Preparation, preparation_id)
    if not prep or prep.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preparation not found")
    if not prep.memory_scan_questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No memory scan questions. Get questions first.",
        )

    correct_count, total, result_flags = _score_memory_scan_answers(
        prep.memory_scan_questions,
        body.answers,
    )
    score_percent = round(100.0 * correct_count / total, 1) if total else 0.0

    assessment = AssessmentSession(
        user_id=current_user.id,
        preparation_id=preparation_id,
        session_type="memory_scan",
        score_percent=score_percent,
    )
    session.add(assessment)
    await session.flush()

    for i, ans in enumerate(body.answers):
        qid = str(ans.get("question_id") or ans.get("id", ""))
        is_correct = result_flags[i] if i < len(result_flags) else False
        answer_row = UserQuestionAnswer(
            session_id=assessment.id,
            question_id=None,
            selected_answer=str(ans.get("selected_answer", "")),
            is_correct=is_correct,
        )
        session.add(answer_row)

    jd = await session.get(JDAnalysis, prep.jd_analysis_id)
    if jd:
        roadmap = await create_roadmap_after_memory_scan(
            session,
            preparation_id=preparation_id,
            user_id=current_user.id,
            jd_analysis=jd,
            memory_scan_questions=prep.memory_scan_questions,
            answer_results=result_flags,
            user_role=current_user.role,
            user_experience_years=current_user.experience_years,
        )
        prep.roadmap_id = roadmap.id
        prep.status = PreparationStatus.ROADMAP_READY
    else:
        prep.status = PreparationStatus.MEMORY_SCAN_DONE

    prep.updated_at = datetime.utcnow()
    session.add(prep)
    await session.commit()

    return {
        "session_id": assessment.id,
        "score_percent": score_percent,
        "total_questions": total,
        "correct_count": correct_count,
        "preparation_id": preparation_id,
        "roadmap_ready": prep.roadmap_id is not None,
    }


@router.get("/{preparation_id}/roadmap")
async def get_preparation_roadmap(
    preparation_id: int,
    session: DBSession,
    current_user: CurrentUser,
    day_index: int | None = Query(None, description="Nếu bỏ trống thì trả về tất cả items"),
):
    """Bước 3: Lấy roadmap của preparation. Không truyền day_index = trả về tất cả items (flat list)."""
    prep = await session.get(Preparation, preparation_id)
    if not prep or prep.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preparation not found")
    if not prep.roadmap_id:
        return {"roadmap_id": None, "tasks": []}

    query = (
        select(DailyTask)
        .where(DailyTask.roadmap_id == prep.roadmap_id)
        .order_by(DailyTask.sort_order, DailyTask.day_index)
    )
    if day_index is not None:
        query = query.where(DailyTask.day_index == day_index)
    result = await session.exec(query)
    tasks = result.all()
    return {
        "roadmap_id": prep.roadmap_id,
        "tasks": [DailyTaskResponse.model_validate(t) for t in tasks],
    }


@router.get("/{preparation_id}/self-check-questions", response_model=list[SelfCheckQuestionDisplay])
async def get_self_check_questions(
    preparation_id: int,
    session: DBSession,
    current_user: CurrentUser,
):
    """
    Bước 4: Câu hỏi giả lập phỏng vấn (LLM). Không phải trắc nghiệm/chấm điểm — để user tự luyện trả lời.
    """
    prep = await session.get(Preparation, preparation_id)
    if not prep or prep.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preparation not found")

    jd = await session.get(JDAnalysis, prep.jd_analysis_id)
    if not jd:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="JD analysis not found")

    questions = await generate_self_check_questions(jd_analysis=jd, limit=12)
    return [SelfCheckQuestionDisplay(id=q["id"], question_text=q["question_text"]) for q in questions]


@router.get("")
async def list_my_preparations(
    session: DBSession,
    current_user: CurrentUser,
):
    """Danh sách preparations của user (mới nhất trước)."""
    result = await session.exec(
        select(Preparation)
        .where(Preparation.user_id == current_user.id)
        .order_by(Preparation.created_at.desc())
        .limit(50)
    )
    items = result.all()
    return [PreparationResponse.model_validate(p) for p in items]
