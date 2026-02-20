"""Preparation services: tạo bộ câu hỏi memory scan (warehouse hoặc AI), pathfinder sau khi có đáp án."""

import json
import logging
import re
from copy import deepcopy
from typing import Any

from openai import AsyncOpenAI
from sqlmodel import col, select

from app.config import settings
from app.modules.analysis.models import JDAnalysis
from app.modules.preparation.models import Preparation, PreparationStatus
from app.modules.questions.models import (
    ContentStatus,
    Question,
    QuestionSkill,
)
from app.modules.roadmap.models import DailyTask, Roadmap
from sqlmodel.ext.asyncio.session import AsyncSession

logger = logging.getLogger(__name__)


async def analyze_knowledge_gaps(
    *,
    user_role: str | None,
    user_experience_years: int | None,
    jd_analysis: JDAnalysis,
    memory_scan_questions: list[dict[str, Any]],
    answer_results: list[bool],
) -> list[str]:
    """
    Gọi LLM phân tích profile + JD + kết quả memory scan → danh sách vùng kiến thức cần cải thiện.
    Trả về list tên các vùng (3–8 items).
    """
    if not settings.openai.api_key:
        return []

    skills = list(jd_analysis.extracted_keywords.get("skills") or [])
    domains = list(jd_analysis.extracted_keywords.get("domains") or [])
    keywords = list(jd_analysis.extracted_keywords.get("keywords") or [])
    jd_summary = f"Skills: {skills}. Domains: {domains}. Keywords: {keywords}."
    profile = f"Role: {user_role or 'not set'}. Experience: {user_experience_years or 0} years."

    # Build Q&A với kết quả đúng/sai
    qa_lines = []
    for i, q in enumerate(memory_scan_questions[:20]):
        ok = answer_results[i] if i < len(answer_results) else False
        qa_lines.append(
            f"- Q: {q.get('question_text', '')[:200]} -> {'Correct' if ok else 'Wrong'}"
        )
    qa_block = "\n".join(qa_lines)

    client = AsyncOpenAI(api_key=settings.openai.api_key)
    prompt = f"""You are an interview coach. Based on:
1) Job description: {jd_summary}
2) Candidate profile: {profile}
3) Memory scan results (Correct/Wrong per question):
{qa_block}

Identify 3 to 8 knowledge areas that this candidate should improve before the interview. Focus on areas where they answered Wrong or that are critical for the JD.
Return ONLY a valid JSON array of short topic names (strings). Example: ["REST API design", "SQL optimization", "Python async"].
No explanation, only the JSON array."""

    try:
        response = await client.chat.completions.create(
            model=settings.openai.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=500,
        )
        content = (response.choices[0].message.content or "").strip()
        if not content:
            return []
        if content.startswith("```"):
            lines = content.split("\n")
            content = "\n".join(
                line for line in lines
                if not (line.strip().startswith("```") and len(line.strip()) <= 5)
            ).strip()
            if content.startswith("```"):
                content = content.split("\n", 1)[-1]
        data = json.loads(content)
        if not isinstance(data, list):
            return []
        return [str(x).strip() for x in data if x][:8]
    except Exception as e:
        logger.exception("analyze_knowledge_gaps failed: %s", e)
        return []


async def generate_roadmap_item_markdown(
    *,
    knowledge_area: str,
    jd_skills_summary: str,
) -> tuple[str, list[dict[str, Any]]]:
    """
    Gọi LLM tạo 1 roadmap item: nội dung markdown chi tiết + danh sách reference (blog, youtube, course).
    Trả về (markdown_content, references).
    """
    if not settings.openai.api_key:
        fallback = f"# {knowledge_area}\n\nÔn và nâng cấp kiến thức về **{knowledge_area}**. Tìm tài liệu chính thức hoặc khóa học phù hợp."
        return fallback, []

    client = AsyncOpenAI(api_key=settings.openai.api_key)
    prompt = f"""You are a technical coach. Create a single learning note (roadmap item) for this topic: "{knowledge_area}".
Job context: {jd_skills_summary}

Requirements:
- Write in Vietnamese.
- Use Markdown: headings (##, ###), bullet lists, code blocks if relevant, bold for key terms.
- Length: about 150-400 words. Include what to learn, key points, and 1-2 short code examples if useful.
- At the end, add a "Tài liệu tham khảo" section with 2-4 real links. Format each as: [Title](URL). Suggest official docs, tech blogs (e.g. dev.to, realpython.com), YouTube, or Coursera when relevant.

Return ONLY the markdown content, no JSON wrapper."""

    try:
        response = await client.chat.completions.create(
            model=settings.openai.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=1500,
        )
        content = (response.choices[0].message.content or "").strip()
        if not content:
            content = f"# {knowledge_area}\n\nÔn và nâng cấp kiến thức về **{knowledge_area}**."
        # Parse [Title](URL) from content for meta.references (optional)
        refs: list[dict[str, Any]] = []
        for m in re.finditer(r"\[([^\]]+)\]\((https?://[^\)]+)\)", content):
            refs.append({"type": "link", "title": m.group(1), "url": m.group(2)})
        return content, refs[:6]
    except Exception as e:
        logger.exception("generate_roadmap_item_markdown failed: %s", e)
        fallback = f"# {knowledge_area}\n\nÔn và nâng cấp kiến thức về **{knowledge_area}**."
        return fallback, []


async def get_questions_from_warehouse(
    session: AsyncSession,
    *,
    skills: list[str],
    tags: list[str],
    limit: int = 8,
) -> list[dict[str, Any]]:
    """Lấy câu hỏi từ question warehouse theo skills/tags từ JD."""
    skills_lower = [s.lower() for s in skills] if skills else []
    tags_lower = [t.lower() for t in tags] if tags else []

    query = (
        select(Question)
        .where(col(Question.deleted_at).is_(None))
        .where(Question.status == ContentStatus.APPROVED.value)
    )
    result = await session.exec(query)
    questions = list(result.unique().all())

    if tags_lower or skills_lower:
        filtered = []
        for q in questions:
            q_tags = [t.lower() for t in (q.tags or [])]
            if tags_lower and any(t in q_tags for t in tags_lower):
                filtered.append(q)
            elif skills_lower and any(s in " ".join(q_tags).lower() for s in skills_lower):
                filtered.append(q)
        questions = filtered if filtered else questions

    import random
    selected = random.sample(questions, min(limit, len(questions))) if questions else []

    out = []
    for i, q in enumerate(selected):
        opts = deepcopy(q.options or {})
        correct = opts.pop("correct_answer", opts.get("correct_index"))
        out.append({
            "id": str(i),
            "question_text": q.content,
            "title": q.title or "",
            "question_type": q.question_type,
            "options": opts,
            "correct_answer": correct,
        })
    return out


async def generate_questions_with_ai(
    session: AsyncSession,
    *,
    jd_analysis: JDAnalysis,
    user_role: str | None,
    limit: int = 8,
) -> list[dict[str, Any]]:
    """Tạo bộ câu hỏi memory scan on-the-fly bằng AI (dựa trên JD + user)."""
    if not settings.openai.api_key:
        return []

    skills = jd_analysis.extracted_keywords.get("skills") or []
    domains = jd_analysis.extracted_keywords.get("domains") or []
    keywords = jd_analysis.extracted_keywords.get("keywords") or []
    context = f"JD skills: {skills}. Domains: {domains}. Keywords: {keywords}."
    if user_role:
        context += f" User role: {user_role}."

    client = AsyncOpenAI(api_key=settings.openai.api_key)
    prompt = f"""Generate exactly {limit} short multiple-choice or true/false questions to assess a candidate's current knowledge for this job. Context: {context}
Return ONLY a valid JSON array. Each item must have:
- "question_text": string
- "question_type": "multiple_choice" or "true_false"
- "options": object (for multiple_choice: "choices" array and "correct_answer" string; for true_false: use "correct_answer": "true" or "false")
- "correct_answer": string

Example: [{{"question_text": "What is REST?", "question_type": "multiple_choice", "options": {{"choices": ["A protocol", "A database", "A language"], "correct_answer": "A protocol"}}, "correct_answer": "A protocol"}}]
"""

    try:
        response = await client.chat.completions.create(
            model=settings.openai.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=settings.openai.max_tokens,
        )
        content = response.choices[0].message.content
        if not content:
            return []
        text_in = content.strip()
        if text_in.startswith("```"):
            lines = text_in.split("\n")
            text_in = "\n".join(
                line for line in lines
                if not (line.strip().startswith("```") and len(line.strip()) <= 5)
            ).strip()
            if text_in.startswith("```"):
                text_in = text_in.split("\n", 1)[-1]
        data = json.loads(text_in)
        if not isinstance(data, list):
            return []
        out = []
        for i, item in enumerate(data[:limit]):
            if not isinstance(item, dict):
                continue
            q_text = item.get("question_text") or item.get("question_text") or ""
            q_type = item.get("question_type") or "multiple_choice"
            opts = item.get("options") or {}
            correct = item.get("correct_answer") or opts.get("correct_answer")
            out.append({
                "id": str(i),
                "question_text": q_text,
                "title": "",
                "question_type": q_type,
                "options": opts,
                "correct_answer": correct,
            })
        return out
    except Exception as e:
        logger.exception("AI question generation failed: %s", e)
        return []


def _score_memory_scan_answers(
    questions: list[dict[str, Any]],
    answers: list[dict[str, Any]],
) -> tuple[int, int, list[bool]]:
    """Tính điểm từ bộ câu hỏi (có correct_answer) và danh sách đáp án. Trả về (correct_count, total, is_correct_per_question)."""
    by_id = {str(q.get("id")): q for q in questions if q.get("id") is not None}
    correct_count = 0
    results = []
    for a in answers:
        qid = str(a.get("question_id") or a.get("id", ""))
        selected = str(a.get("selected_answer", "")).strip()
        q = by_id.get(qid)
        if not q:
            results.append(False)
            continue
        correct_ans = q.get("correct_answer")
        if correct_ans is None and isinstance(q.get("options"), dict):
            correct_ans = q["options"].get("correct_answer")
        correct_ans = str(correct_ans).strip() if correct_ans is not None else None
        ok = correct_ans is not None and selected == correct_ans
        if ok:
            correct_count += 1
        results.append(ok)
    return correct_count, len(answers), results


async def create_roadmap_after_memory_scan(
    session: AsyncSession,
    *,
    preparation_id: int,
    user_id: int,
    jd_analysis: JDAnalysis,
    memory_scan_questions: list[dict[str, Any]],
    answer_results: list[bool],
    user_role: str | None = None,
    user_experience_years: int | None = None,
) -> Roadmap:
    """
    Bước 3: Sau khi user nộp memory scan:
    1) LLM phân tích profile + JD + kết quả scan → danh sách vùng kiến thức cần cải thiện.
    2) Với mỗi vùng, gọi LLM tạo rich markdown content (roadmap item).
    """
    skills = list(jd_analysis.extracted_keywords.get("skills") or [])
    domains = list(jd_analysis.extracted_keywords.get("domains") or [])
    keywords = list(jd_analysis.extracted_keywords.get("keywords") or [])
    jd_skills_summary = f"Skills: {skills}. Domains: {domains}. Keywords: {keywords}."

    knowledge_areas: list[str] = []
    if settings.openai.api_key:
        knowledge_areas = await analyze_knowledge_gaps(
            user_role=user_role,
            user_experience_years=user_experience_years,
            jd_analysis=jd_analysis,
            memory_scan_questions=memory_scan_questions,
            answer_results=answer_results,
        )
    if not knowledge_areas:
        knowledge_areas = skills[:5] + domains[:3] + keywords[:2]
    if not knowledge_areas:
        knowledge_areas = ["Core concepts", "Technical skills", "Best practices"]

    roadmap = Roadmap(
        user_id=user_id,
        preparation_id=preparation_id,
        jd_analysis_id=jd_analysis.id,
        interview_date=jd_analysis.interview_date,
    )
    session.add(roadmap)
    await session.flush()

    for sort_order, area in enumerate(knowledge_areas[:10]):
        content, refs = await generate_roadmap_item_markdown(
            knowledge_area=area,
            jd_skills_summary=jd_skills_summary,
        )
        task = DailyTask(
            roadmap_id=roadmap.id,
            day_index=sort_order,
            title=f"Học: {area}",
            content=content,
            content_type="markdown",
            sort_order=sort_order,
            meta={"references": refs} if refs else {},
        )
        session.add(task)

    await session.flush()
    return roadmap
