"""User-facing question API: fetch questions for assessment/practice and submit answers."""

import random
from copy import deepcopy
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query, status
from sqlmodel import col, select

from app.modules.account.models import User
from app.modules.questions.models import (
    AssessmentSession,
    ContentStatus,
    Question,
    QuestionSkill,
    SubmitAnswersRequest,
    SubmitAnswersResponse,
    UserQuestionAnswer,
    UserQuestionItem,
)
from app.utils.auth import CurrentUser
from app.utils.db import DBSession

router = APIRouter(prefix="/api/questions", tags=["user-questions"])


def _options_for_display(options: dict) -> dict:
    """Return options dict without correct_answer for client display."""
    out = deepcopy(options)
    out.pop("correct_answer", None)
    out.pop("correct_index", None)
    return out


def _get_correct_answer(question: Question) -> str | None:
    """Get correct answer from question options (for scoring)."""
    opts = question.options or {}
    if "correct_answer" in opts:
        return str(opts["correct_answer"]).strip()
    idx = opts.get("correct_index")
    if idx is not None and "choices" in opts:
        choices = opts["choices"]
        if isinstance(choices, list) and 0 <= idx < len(choices):
            return str(choices[idx]).strip()
    return None


@router.get("", response_model=list[UserQuestionItem])
async def list_questions_for_user(
    session: DBSession,
    current_user: CurrentUser,
    mode: str = Query("memory_scan", description="memory_scan | knowledge_check"),
    tags: list[str] | None = Query(None, description="Filter by tags"),
    skill_ids: list[int] | None = Query(None, description="Filter by skill IDs"),
    limit: int = Query(10, ge=1, le=20, description="Max questions to return"),
) -> list[UserQuestionItem]:
    """
    Get questions for Memory Scan (adaptive) or Knowledge Check (practice).
    Only approved questions are returned. For memory_scan, 5-10 random questions.
    """
    query = (
        select(Question)
        .where(col(Question.deleted_at).is_(None))
        .where(Question.status == ContentStatus.APPROVED.value)
    )

    if skill_ids:
        query = query.join(QuestionSkill).where(
            col(QuestionSkill.skill_id).in_(skill_ids)
        )

    result = await session.exec(query)
    questions = list(result.unique().all())

    if tags:
        tag_set = set(t.lower() for t in tags)
        questions = [
            q for q in questions
            if q.tags and any(t.lower() in tag_set for t in (q.tags or []))
        ]

    if not questions:
        return []

    # Memory scan: 5-10, knowledge_check: up to limit
    count = min(limit, len(questions))
    if mode == "memory_scan":
        count = min(max(5, count), 10, len(questions))
    selected = random.sample(questions, count)

    items = []
    for q in selected:
        items.append(
            UserQuestionItem(
                id=q.id,
                title=q.title,
                content=q.content,
                question_type=q.question_type,
                options=_options_for_display(q.options),
                difficulty=q.difficulty,
                estimated_time_seconds=q.estimated_time_seconds,
                tags=q.tags or [],
            )
        )
    return items


@router.post("/submit", response_model=SubmitAnswersResponse)
async def submit_answers(
    session: DBSession,
    current_user: CurrentUser,
    body: SubmitAnswersRequest,
) -> SubmitAnswersResponse:
    """Submit answers for an assessment/practice session and get score."""
    if body.session_type not in ("memory_scan", "knowledge_check"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="session_type must be memory_scan or knowledge_check",
        )
    if not body.answers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one answer is required",
        )

    assessment = AssessmentSession(
        user_id=current_user.id,
        session_type=body.session_type,
    )
    session.add(assessment)
    await session.flush()

    correct_count = 0
    for item in body.answers:
        question = await session.get(Question, item.question_id)
        correct = False
        if question and not question.deleted_at:
            correct_ans = _get_correct_answer(question)
            if correct_ans is not None:
                correct = str(item.selected_answer).strip() == correct_ans
        if correct:
            correct_count += 1
        answer_row = UserQuestionAnswer(
            session_id=assessment.id,
            question_id=item.question_id,
            selected_answer=item.selected_answer,
            is_correct=correct,
        )
        session.add(answer_row)

    total = len(body.answers)
    score_percent = round(100.0 * correct_count / total, 1) if total else 0.0
    assessment.score_percent = score_percent
    await session.commit()
    await session.refresh(assessment)

    return SubmitAnswersResponse(
        session_id=assessment.id,
        score_percent=score_percent,
        total_questions=total,
        correct_count=correct_count,
    )
