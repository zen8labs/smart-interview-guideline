"""Preparation services: tạo bộ câu hỏi memory scan (warehouse hoặc AI), pathfinder sau khi có đáp án."""

import json
import logging
import re
from copy import deepcopy
from typing import Any

from sqlmodel import col, select

from app.config import settings
from app.utils.openai_client import get_openai_client
from app.modules.analysis.models import JDAnalysis
from app.utils.llm_language import get_language_instruction
from app.modules.analysis.services import normalize_extracted_keyword_names
from app.modules.preparation.models import Preparation, PreparationStatus
from app.modules.questions.models import (
    ContentStatus,
    Question,
    QuestionSkill,
)
from app.modules.roadmap.models import DailyTask, Roadmap
from sqlmodel.ext.asyncio.session import AsyncSession

logger = logging.getLogger(__name__)


async def derive_knowledge_areas_from_jd_and_profile(
    *,
    jd_analysis: JDAnalysis,
    user_role: str | None = None,
    user_experience_years: int | None = None,
    preferred_language: str | None = None,
) -> list[str]:
    """
    Xác định các vùng kiến thức cần có từ JD và profile người dùng (trước memory scan).
    Dùng chung cho: tạo câu hỏi memory scan, roadmap, và self-check — đảm bảo thống nhất.
    Trả về 3–8 tên vùng kiến thức (strings).
    """
    if not settings.openai.api_key:
        kw = jd_analysis.extracted_keywords or {}
        skills, domains, keywords = normalize_extracted_keyword_names(kw)
        return (skills[:4] + domains[:3] + keywords[:2]) or [
            "Core concepts",
            "Technical skills",
            "Best practices",
        ]

    kw = jd_analysis.extracted_keywords or {}
    skills, domains, keywords = normalize_extracted_keyword_names(kw)
    requirements_summary = kw.get("requirements_summary") or ""
    jd_summary = f"Skills: {skills}. Domains: {domains}. Keywords: {keywords}."
    if requirements_summary:
        jd_summary += f" Key requirements: {requirements_summary}"
    profile = f"Role: {user_role or 'not set'}. Experience: {user_experience_years or 0} years."

    lang_instruction = get_language_instruction(preferred_language)
    client = get_openai_client()
    prompt = f"""You are an interview coach. Based ONLY on:
1) Job description: {jd_summary}
2) Candidate profile: {profile}

Identify 3 to 8 knowledge areas (vùng kiến thức) that this candidate should be assessed on and may need to improve for this job. These areas will be used to generate memory scan questions, learning roadmap, and self-check questions — so they must be concrete, testable topics (e.g. "REST API design", "SQL optimization", "Python async", "System design basics").
{lang_instruction}
Return ONLY a valid JSON array of short topic names (strings). No explanation."""

    try:
        response = await client.chat.completions.create(
            model=settings.openai.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=500,
        )
        content = (response.choices[0].message.content or "").strip()
        if not content:
            return _fallback_knowledge_areas(jd_analysis)
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
            return _fallback_knowledge_areas(jd_analysis)
        areas = [str(x).strip() for x in data if x][:8]
        return areas if areas else _fallback_knowledge_areas(jd_analysis)
    except Exception as e:
        logger.exception("derive_knowledge_areas_from_jd_and_profile failed: %s", e)
        return _fallback_knowledge_areas(jd_analysis)


def _fallback_knowledge_areas(jd_analysis: JDAnalysis) -> list[str]:
    """Fallback khi LLM không có hoặc lỗi."""
    kw = jd_analysis.extracted_keywords or {}
    skills, domains, keywords = normalize_extracted_keyword_names(kw)
    return (skills[:4] + domains[:3] + keywords[:2]) or [
        "Core concepts",
        "Technical skills",
        "Best practices",
    ]


async def analyze_knowledge_gaps(
    *,
    user_role: str | None,
    user_experience_years: int | None,
    jd_analysis: JDAnalysis,
    memory_scan_questions: list[dict[str, Any]],
    answer_results: list[bool],
    preferred_language: str | None = None,
) -> list[str]:
    """
    Gọi LLM phân tích profile + JD + kết quả memory scan → danh sách vùng kiến thức cần cải thiện.
    Trả về list tên các vùng (3–8 items).
    """
    if not settings.openai.api_key:
        return []

    kw = jd_analysis.extracted_keywords or {}
    skills, domains, keywords = normalize_extracted_keyword_names(kw)
    requirements_summary = kw.get("requirements_summary") or ""
    jd_summary = f"Skills: {skills}. Domains: {domains}. Keywords: {keywords}."
    if requirements_summary:
        jd_summary += f" Key requirements: {requirements_summary}"
    profile = f"Role: {user_role or 'not set'}. Experience: {user_experience_years or 0} years."

    # Build Q&A với kết quả đúng/sai
    qa_lines = []
    for i, q in enumerate(memory_scan_questions[:20]):
        ok = answer_results[i] if i < len(answer_results) else False
        qa_lines.append(
            f"- Q: {q.get('question_text', '')[:200]} -> {'Correct' if ok else 'Wrong'}"
        )
    qa_block = "\n".join(qa_lines)

    lang_instruction = get_language_instruction(preferred_language)
    client = get_openai_client()
    prompt = f"""You are an interview coach. Based on:
1) Job description: {jd_summary}
2) Candidate profile: {profile}
3) Memory scan results (Correct/Wrong per question):
{qa_block}

Identify 3 to 8 knowledge areas that this candidate should improve before the interview. Focus on areas where they answered Wrong or that are critical for the JD.
{lang_instruction}
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
    preferred_language: str | None = None,
) -> tuple[str, list[dict[str, Any]]]:
    """
    Gọi LLM tạo 1 roadmap item: nội dung markdown chi tiết + danh sách reference (blog, youtube, course).
    Trả về (markdown_content, references).
    """
    if not settings.openai.api_key:
        fallback = f"# {knowledge_area}\n\nÔn và nâng cấp kiến thức về **{knowledge_area}**. Tìm tài liệu chính thức hoặc khóa học phù hợp."
        return fallback, []

    lang_instruction = get_language_instruction(preferred_language)
    client = get_openai_client()
    prompt = f"""You are a technical coach. Write a substantive learning note (roadmap item) for: "{knowledge_area}".
Job context: {jd_skills_summary}

The note must provide CLEAR, USEFUL INFORMATION — not just keywords for the reader to search. Structure it as follows:

1. **Overview** (2-3 sentences): What this topic is and why it matters for the role. No vague phrases; be specific.

2. **Key concepts** (bulleted or numbered): Each item must include a SHORT EXPLANATION (1-2 sentences), not just the term. Example: "**REST**: Architecture style where the server exposes resources via URLs; client uses HTTP methods (GET, POST, etc.)."

3. **What to learn / Practice**: Concrete steps or sub-topics with brief guidance (what to read, what to try). Include 1-2 short code snippets if relevant (syntax-highlightable).

4. **Common interview angles**: 2-3 typical questions or topics interviewers ask about this area. One sentence each is enough.

5. **References**: A section (e.g. "Tài liệu tham khảo" or "References") with 2-4 real links. Format: [Title](URL). Prefer official docs, dev.to, realpython.com, MDN, YouTube, Coursera.

Requirements:
- {lang_instruction}
- Use Markdown: ## and ### headings, bullet lists, code blocks where useful, **bold** for terms.
- Length: 250-500 words so the reader gets real value without having to "go research" blindly.
- Return ONLY the markdown content, no JSON wrapper or commentary."""

    try:
        response = await client.chat.completions.create(
            model=settings.openai.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=2500,
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
    preferred_language: str | None = None,
    knowledge_areas: list[str] | None = None,
) -> list[dict[str, Any]]:
    """
    Tạo bộ câu hỏi memory scan bằng AI.
    Nếu có knowledge_areas: sinh câu hỏi phủ đều các vùng (1–2 câu/vùng), mỗi câu gắn knowledge_area_index.
    Nếu không: sinh theo JD + user như cũ.
    """
    if not settings.openai.api_key:
        return []

    skills, domains, keywords = normalize_extracted_keyword_names(jd_analysis.extracted_keywords or {})
    context = f"JD skills: {skills}. Domains: {domains}. Keywords: {keywords}."
    if user_role:
        context += f" User role: {user_role}."

    lang_instruction = get_language_instruction(preferred_language)
    client = get_openai_client()

    if knowledge_areas:
        # Sinh câu hỏi theo từng vùng kiến thức — đảm bảo phủ đều và gắn area
        areas_text = ", ".join(knowledge_areas)
        per_area = max(1, limit // len(knowledge_areas))
        prompt = f"""Generate multiple-choice or true/false questions to assess the candidate for this job. Context: {context}

Knowledge areas to cover (generate about {per_area} question(s) per area): {areas_text}

For each question, the topic must clearly belong to one of these knowledge areas.
{lang_instruction}
Return ONLY a valid JSON array. Each item must have:
- "question_text": string
- "question_type": "multiple_choice" or "true_false"
- "options": object (for multiple_choice: "choices" array and "correct_answer"; for true_false: "correct_answer": "true" or "false")
- "correct_answer": string
- "knowledge_area": string (exactly one of: {json.dumps(knowledge_areas)})

Total: about {min(limit, len(knowledge_areas) * per_area)} questions, spread across the areas."""
    else:
        prompt = f"""Generate exactly {limit} short multiple-choice or true/false questions to assess a candidate's current knowledge for this job. Context: {context}
{lang_instruction}
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
            area_name = item.get("knowledge_area") if knowledge_areas else None
            area_idx = (
                knowledge_areas.index(area_name) if area_name and knowledge_areas and area_name in knowledge_areas else None
            )
            q_out = {
                "id": str(i),
                "question_text": q_text,
                "title": "",
                "question_type": q_type,
                "options": opts,
                "correct_answer": correct,
            }
            if area_idx is not None:
                q_out["knowledge_area_index"] = area_idx
                q_out["knowledge_area"] = knowledge_areas[area_idx]
            out.append(q_out)
        return out
    except Exception as e:
        logger.exception("AI question generation failed: %s", e)
        return []


async def generate_self_check_questions(
    *,
    jd_analysis: JDAnalysis,
    limit: int = 12,
    preferred_language: str | None = None,
    knowledge_areas: list[str] | None = None,
) -> list[dict[str, Any]]:
    """
    Tạo bộ câu hỏi giả lập phỏng vấn bằng LLM: câu hỏi mở có thể xuất hiện trong buổi phỏng vấn.
    Nếu có knowledge_areas: sinh câu hỏi phủ các vùng kiến thức (thống nhất với memory scan và roadmap).
    Không phải trắc nghiệm, không chấm điểm — chỉ để user tự luyện trả lời.
    """
    if not settings.openai.api_key:
        return []

    skills, domains, keywords = normalize_extracted_keyword_names(jd_analysis.extracted_keywords or {})
    kw = jd_analysis.extracted_keywords or {}
    requirements_summary = kw.get("requirements_summary") or ""
    context = f"Skills: {skills}. Domains: {domains}. Keywords: {keywords}."
    if requirements_summary:
        context += f" Key requirements: {requirements_summary}"

    lang_instruction = get_language_instruction(preferred_language)
    client = get_openai_client()
    areas_note = ""
    if knowledge_areas:
        areas_note = f"\nCover these knowledge areas (generate 1-2 questions per area): {', '.join(knowledge_areas)}."
    prompt = f"""You are an expert interviewer. Based on this job description context, generate {limit} realistic interview questions that could be asked in a real interview for this role.

Context: {context}{areas_note}

Requirements:
- Questions must be OPEN-ENDED (no multiple choice). Examples: "Tell me about a time when...", "How would you approach...", "What is your experience with...", "Explain...", "Describe..."
- Mix: technical questions, behavioral/situational, experience-based, and role-specific.
- {lang_instruction}
- Return ONLY a valid JSON array of objects, each with a single key "question_text" (string).

Example: [{{"question_text": "Kể về một lần bạn xử lý conflict trong team?"}}, {{"question_text": "How do you approach debugging a production issue?"}}]
"""

    try:
        response = await client.chat.completions.create(
            model=settings.openai.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.6,
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
            q_text = (item.get("question_text") or item.get("question") or "").strip()
            if not q_text:
                continue
            out.append({"id": str(i), "question_text": q_text})
        return out
    except Exception as e:
        logger.exception("Self-check question generation failed: %s", e)
        return []


def _get_correct_answer_values_for_scoring(q: dict[str, Any]) -> tuple[str | None, str | None]:
    """
    Trả về (canonical_value, index_as_string) để so sánh với selected_answer.
    - canonical_value: text đáp án đúng (từ correct_answer hoặc resolve từ correct_index + choices).
    - index_as_string: "0", "1", ... nếu đáp án đúng được lưu bằng index (frontend có thể gửi index).
    """
    correct_ans = q.get("correct_answer")
    if correct_ans is None and isinstance(q.get("options"), dict):
        correct_ans = q["options"].get("correct_answer")
    if correct_ans is None:
        return None, None
    correct_ans = str(correct_ans).strip()
    opts = q.get("options") or {}
    choices = opts.get("choices") if isinstance(opts, dict) else None
    index_str: str | None = None
    if isinstance(choices, list) and correct_ans.isdigit():
        idx = int(correct_ans)
        if 0 <= idx < len(choices):
            index_str = correct_ans
            c = choices[idx]
            if isinstance(c, str):
                return c.strip(), index_str
            if isinstance(c, dict):
                text = str(c.get("text") or c.get("label") or c.get("value") or c.get("content") or "").strip()
                return (text or None), index_str
            return str(c).strip(), index_str
    return correct_ans if correct_ans else None, None


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
        canonical, index_str = _get_correct_answer_values_for_scoring(q)
        ok = False
        if canonical is not None:
            ok = selected == canonical
        if not ok and index_str is not None:
            ok = selected == index_str
        if ok:
            correct_count += 1
        results.append(ok)
    return correct_count, len(answers), results


def _knowledge_level_from_percent(percent: float) -> int:
    """Map correct-answer percentage to 5-level scale: 1=very low .. 5=very high."""
    if percent >= 80:
        return 5
    if percent >= 60:
        return 4
    if percent >= 40:
        return 3
    if percent >= 20:
        return 2
    return 1


async def evaluate_memory_scan_with_llm(
    *,
    memory_scan_questions: list[dict[str, Any]],
    answers: list[dict[str, Any]],
    result_flags: list[bool],
    score_percent: float,
    correct_count: int,
    total_questions: int,
    knowledge_assessment: list[dict[str, Any]] | None = None,
    jd_summary: str = "",
    preferred_language: str | None = None,
) -> str:
    """
    Gửi bài test + đáp án user + kết quả chấm lên LLM để nhận báo cáo đánh giá.
    LLM đưa ra insight cả từ câu sai (ví dụ đáp án sai vẫn có thể phản ánh mức độ hiểu biết).
    Trả về report dạng Markdown; lỗi hoặc không có API key thì trả về chuỗi rỗng.
    """
    if not settings.openai.api_key:
        return ""

    by_id = {str(q.get("id")): q for q in memory_scan_questions if q.get("id") is not None}
    qa_lines = []
    for i, ans in enumerate(answers):
        qid = str(ans.get("question_id") or ans.get("id", ""))
        selected = str(ans.get("selected_answer", "")).strip()
        q = by_id.get(qid)
        if not q:
            continue
        ok = result_flags[i] if i < len(result_flags) else False
        question_text = (q.get("question_text") or "")[:300]
        qa_lines.append(
            f"- **Q:** {question_text}\n  **User's answer:** {selected} → **{'Correct' if ok else 'Wrong'}**"
        )
    qa_block = "\n".join(qa_lines[:25])

    summary = f"Score: {correct_count}/{total_questions} ({score_percent}% correct)."
    if knowledge_assessment:
        areas = [a.get("knowledge_area", "") for a in knowledge_assessment[:8] if a.get("knowledge_area")]
        if areas:
            summary += f" Knowledge areas assessed: {', '.join(areas)}."

    lang_instruction = get_language_instruction(preferred_language)
    client = get_openai_client()
    prompt = f"""You are an expert interview coach. A candidate just completed a memory scan (knowledge check) for job preparation.

**Context (optional):** {jd_summary or "General technical interview preparation."}

**Test results:**
{summary}

**Per-question breakdown (question, user's answer, correct/wrong):**
{qa_block}

Write a short **evaluation report** (2–4 paragraphs) in Markdown that:
1. Summarizes overall performance in a constructive way.
2. Draws **insights from wrong answers**: even wrong choices can reveal what the candidate might believe or confuse (e.g. confusion between X and Y, or a partial understanding). Mention 1–3 such insights when relevant.
3. Suggests 1–3 concrete focus areas for the next steps (roadmap/study).

Be concise, supportive, and specific. Use bullet points or short paragraphs. Do not list all questions again.
{lang_instruction}"""

    try:
        response = await client.chat.completions.create(
            model=settings.openai.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=1000,
        )
        content = (response.choices[0].message.content or "").strip()
        return content if content else ""
    except Exception as e:
        logger.exception("evaluate_memory_scan_with_llm failed: %s", e)
        return ""


async def get_knowledge_areas_for_assessment(
    *,
    jd_analysis: JDAnalysis,
    memory_scan_questions: list[dict[str, Any]],
    answer_results: list[bool],
    user_role: str | None = None,
    user_experience_years: int | None = None,
    preferred_language: str | None = None,
    preparation_knowledge_areas: list[str] | None = None,
) -> list[str]:
    """
    Get knowledge areas (for displaying per-area level) without creating roadmap.
    Ưu tiên dùng preparation_knowledge_areas (đã xác định trước memory scan) để thống nhất với roadmap/self-check.
    """
    if preparation_knowledge_areas:
        return list(preparation_knowledge_areas)
    if settings.openai.api_key:
        areas = await analyze_knowledge_gaps(
            user_role=user_role,
            user_experience_years=user_experience_years,
            jd_analysis=jd_analysis,
            memory_scan_questions=memory_scan_questions,
            answer_results=answer_results,
            preferred_language=preferred_language,
        )
        if areas:
            return areas
    skills, domains, keywords = normalize_extracted_keyword_names(
        jd_analysis.extracted_keywords or {}
    )
    return skills[:5] + domains[:3] + keywords[:2] or ["Core concepts", "Technical skills", "Best practices"]


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
    preferred_language: str | None = None,
    preparation_knowledge_areas: list[str] | None = None,
) -> tuple[Roadmap, list[str]]:
    """
    Bước 3: Sau khi user nộp memory scan.
    Ưu tiên dùng preparation_knowledge_areas (đã xác định trước memory scan) để roadmap khớp với câu hỏi và self-check.
    Với mỗi vùng kiến thức, tạo 1 roadmap item (markdown + references).
    """
    skills, domains, keywords = normalize_extracted_keyword_names(jd_analysis.extracted_keywords or {})
    kw = jd_analysis.extracted_keywords or {}
    requirements_summary = kw.get("requirements_summary") or ""
    jd_skills_summary = f"Skills: {skills}. Domains: {domains}. Keywords: {keywords}."
    if requirements_summary:
        jd_skills_summary += f" Key requirements: {requirements_summary}"

    knowledge_areas: list[str] = list(preparation_knowledge_areas) if preparation_knowledge_areas else []
    if not knowledge_areas and settings.openai.api_key:
        knowledge_areas = await analyze_knowledge_gaps(
            user_role=user_role,
            user_experience_years=user_experience_years,
            jd_analysis=jd_analysis,
            memory_scan_questions=memory_scan_questions,
            answer_results=answer_results,
            preferred_language=preferred_language,
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
            preferred_language=preferred_language,
        )
        task = DailyTask(
            roadmap_id=roadmap.id,
            day_index=sort_order,
            title=area,
            content=content,
            content_type="markdown",
            sort_order=sort_order,
            meta={"references": refs} if refs else {},
        )
        session.add(task)

    await session.flush()
    return roadmap, knowledge_areas
