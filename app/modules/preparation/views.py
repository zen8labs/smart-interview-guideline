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
    get_knowledge_areas_for_assessment,
    _knowledge_level_from_percent,
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
            preferred_language=current_user.preferred_language,
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
                preferred_language=current_user.preferred_language,
            )
    if not questions:
        questions = await generate_questions_with_ai(
            session,
            jd_analysis=jd,
            user_role=current_user.role,
            limit=8,
            preferred_language=current_user.preferred_language,
        )

    prep.memory_scan_questions = questions
    prep.updated_at = datetime.utcnow()
    session.add(prep)
    await session.commit()

    return _questions_for_display(questions)


def _compute_knowledge_assessment(
    knowledge_areas: list[str],
    result_flags: list[bool],
) -> list[dict]:
    """Compute per-area level (5-scale) from round-robin question assignment."""
    if not knowledge_areas or not result_flags:
        return []
    n_areas = len(knowledge_areas)
    area_correct: list[int] = [0] * n_areas
    area_total: list[int] = [0] * n_areas
    for i, is_correct in enumerate(result_flags):
        idx = i % n_areas
        area_total[idx] += 1
        if is_correct:
            area_correct[idx] += 1
    return [
        {
            "knowledge_area": area_name,
            "level": _knowledge_level_from_percent(
                (100.0 * area_correct[idx] / area_total[idx]) if area_total[idx] else 0.0
            ),
            "correct_count": area_correct[idx],
            "total_count": area_total[idx],
        }
        for idx, area_name in enumerate(knowledge_areas)
    ]


@router.post("/{preparation_id}/memory-scan/submit")
async def submit_memory_scan(
    preparation_id: int,
    body: MemoryScanSubmitRequest,
    session: DBSession,
    current_user: CurrentUser,
):
    """
    Nộp đáp án memory scan: chấm điểm, lưu kết quả. User xem kết quả rồi quyết định
    "Tiếp tục tạo roadmap" hoặc "Làm lại scan". Không tự tạo roadmap.
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
        is_correct = result_flags[i] if i < len(result_flags) else False
        answer_row = UserQuestionAnswer(
            session_id=assessment.id,
            question_id=None,
            selected_answer=str(ans.get("selected_answer", "")),
            is_correct=is_correct,
        )
        session.add(answer_row)

    knowledge_assessment: list[dict] = []
    jd = await session.get(JDAnalysis, prep.jd_analysis_id)
    if jd:
        knowledge_areas = await get_knowledge_areas_for_assessment(
            jd_analysis=jd,
            memory_scan_questions=prep.memory_scan_questions,
            answer_results=result_flags,
            user_role=current_user.role,
            user_experience_years=current_user.experience_years,
            preferred_language=current_user.preferred_language,
        )
        knowledge_assessment = _compute_knowledge_assessment(knowledge_areas, result_flags)

    prep.status = PreparationStatus.MEMORY_SCAN_DONE
    prep.last_memory_scan_result = {
        "score_percent": score_percent,
        "correct_count": correct_count,
        "total_questions": total,
        "knowledge_assessment": knowledge_assessment,
        "session_id": assessment.id,
    }
    prep.updated_at = datetime.utcnow()
    session.add(prep)
    await session.commit()

    return {
        "session_id": assessment.id,
        "score_percent": score_percent,
        "total_questions": total,
        "correct_count": correct_count,
        "preparation_id": preparation_id,
        "roadmap_ready": False,
        "knowledge_assessment": knowledge_assessment,
    }


@router.post("/{preparation_id}/create-roadmap")
async def create_roadmap(
    preparation_id: int,
    session: DBSession,
    current_user: CurrentUser,
):
    """
    Tạo roadmap từ kết quả memory scan lần cuối (user bấm "Tiếp tục tạo roadmap").
    """
    prep = await session.get(Preparation, preparation_id)
    if not prep or prep.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preparation not found")
    if not prep.memory_scan_questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No memory scan data. Complete memory scan first.",
        )
    if prep.roadmap_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Roadmap already created for this preparation.",
        )

    # Lấy session memory scan mới nhất và đáp án
    stmt = (
        select(AssessmentSession)
        .where(AssessmentSession.preparation_id == preparation_id)
        .where(AssessmentSession.session_type == "memory_scan")
        .order_by(AssessmentSession.created_at.desc())
        .limit(1)
    )
    result = await session.exec(stmt)
    last_session = result.first()
    if not last_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No memory scan session found.",
        )

    ans_stmt = (
        select(UserQuestionAnswer)
        .where(UserQuestionAnswer.session_id == last_session.id)
        .order_by(UserQuestionAnswer.id)
    )
    ans_result = await session.exec(ans_stmt)
    answers = list(ans_result.all())
    result_flags = [a.is_correct for a in answers]

    jd = await session.get(JDAnalysis, prep.jd_analysis_id)
    if not jd:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="JD analysis not found")

    roadmap, _ = await create_roadmap_after_memory_scan(
        session,
        preparation_id=preparation_id,
        user_id=current_user.id,
        jd_analysis=jd,
        memory_scan_questions=prep.memory_scan_questions,
        answer_results=result_flags,
        user_role=current_user.role,
        user_experience_years=current_user.experience_years,
        preferred_language=current_user.preferred_language,
    )
    prep.roadmap_id = roadmap.id
    prep.status = PreparationStatus.ROADMAP_READY
    prep.updated_at = datetime.utcnow()
    session.add(prep)
    await session.commit()

    return {"roadmap_id": roadmap.id, "preparation_id": preparation_id}


@router.post("/{preparation_id}/memory-scan/reset")
async def reset_memory_scan(
    preparation_id: int,
    session: DBSession,
    current_user: CurrentUser,
):
    """
    Xóa kết quả memory scan lần cuối để user có thể "Làm lại scan".
    """
    prep = await session.get(Preparation, preparation_id)
    if not prep or prep.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preparation not found")

    prep.last_memory_scan_result = None
    prep.updated_at = datetime.utcnow()
    session.add(prep)
    await session.commit()
    return {"ok": True}


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

    questions = await generate_self_check_questions(
        jd_analysis=jd,
        limit=12,
        preferred_language=current_user.preferred_language,
    )
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
