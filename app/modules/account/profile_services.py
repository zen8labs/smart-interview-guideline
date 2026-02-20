"""Profile services: CV text extraction and LLM-based profile parsing."""

import json
import logging
from typing import Any

from app.config import settings
from app.utils.openai_client import get_openai_client
from app.utils.llm_language import get_language_instruction

logger = logging.getLogger(__name__)

MAX_CV_TEXT_LENGTH = 30_000  # truncate for LLM context
MAX_SKILLS_SUMMARY_LENGTH = 4_000  # cap stored skills summary
MAX_EDUCATION_SUMMARY_LENGTH = 3_000  # cap stored education summary

# Map common job titles/roles from CV to our UserRole-like values
ROLE_NORMALIZE_MAP = {
    "backend": "backend",
    "back-end": "backend",
    "back end": "backend",
    "frontend": "frontend",
    "front-end": "frontend",
    "front end": "frontend",
    "fullstack": "fullstack",
    "full-stack": "fullstack",
    "full stack": "fullstack",
    "full stack developer": "fullstack",
    "software engineer": "fullstack",
    "developer": "fullstack",
    "tester": "tester",
    "qa": "tester",
    "quality assurance": "tester",
    "ba": "ba",
    "business analyst": "ba",
    "devops": "devops",
    "data": "data",
    "data engineer": "data",
    "data scientist": "data",
    "mobile": "mobile",
    "mobile developer": "mobile",
    "ios": "mobile",
    "android": "mobile",
}


def _normalize_role_from_llm(value: str | None) -> str | None:
    """Map LLM-extracted role string to our enum value if possible."""
    if not value or not value.strip():
        return None
    lower = value.strip().lower()
    for key, our_value in ROLE_NORMALIZE_MAP.items():
        if key in lower:
            return our_value
    return None


async def extract_profile_from_cv_llm(
    cv_text: str,
    preferred_language: str | None = None,
) -> dict[str, Any]:
    """
    Use OpenAI to extract structured profile fields from CV/resume text.

    Returns a dict with keys: full_name, phone, linkedin_url, role, experience_years,
    current_company, skills_summary, education_summary. Values may be None or missing.
    """
    if not cv_text or not cv_text.strip():
        return {}

    if not settings.openai.api_key:
        logger.warning("OPENAI_API_KEY not set; skipping CV profile extraction")
        return {}

    truncated = cv_text[:MAX_CV_TEXT_LENGTH]
    if len(cv_text) > MAX_CV_TEXT_LENGTH:
        truncated += "\n\n[Text truncated for analysis.]"

    lang_instruction = get_language_instruction(preferred_language)
    client = get_openai_client()
    prompt = f"""Analyze the following CV/Resume text and extract structured, detailed information. Do not return only keywords; extract full context and format each section clearly.
{lang_instruction} Use that language for role names and all free-text sections (skills_summary, education_summary).

Return ONLY a valid JSON object with exactly these keys (use null for missing values):

- "full_name": string — full name of the candidate
- "phone": string — phone number if present
- "linkedin_url": string — LinkedIn profile URL if present
- "role": string — best matching job role (e.g. "Backend Developer", "Full-Stack Developer", "Data Engineer", "QA/Tester", "Business Analyst", "DevOps", "Mobile Developer")
- "experience_years": number or null — total years of professional experience (integer)
- "current_company": string — current or most recent company name (and optionally brief context, e.g. "Company X (Fintech)")

- "skills_summary": string — DETAILED, FORMATTED section. Structure by category (e.g. Programming Languages, Frameworks & Libraries, Tools & Platforms, Soft Skills). For each category use a clear heading and list items. Include level or years of experience when stated in the CV (e.g. "Python (5 years)", "React (intermediate)"). Use newlines between categories and between items. Keep concise but informative; max 2000 characters.

- "education_summary": string — DETAILED, FORMATTED section. One block per degree/certification. Each block must include: degree/certification name, institution name, year or date range. Optionally add: major, honors, thesis topic, GPA if present. Use newlines to separate entries. Example format:
  • [Degree], [Institution] ([Year])
    [Optional: Major, honors, or one line of detail]
  • [Next entry]
Max 1500 characters.

Formatting rules for skills_summary and education_summary:
- Use plain text with newlines; no markdown (no ** or ##).
- Use consistent punctuation and spacing.
- Use bullet (•) or dash (-) for list items if helpful for readability.
- Preserve exact names of technologies, schools, and titles from the CV.

CV/Resume text:
"""
    prompt += truncated

    try:
        response = await client.chat.completions.create(
            model=settings.openai.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=settings.openai.max_tokens,
        )
        content = response.choices[0].message.content
        if not content:
            return {}

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
        if not isinstance(data, dict):
            return {}

        role_raw = data.get("role")
        if isinstance(role_raw, str):
            normalized = _normalize_role_from_llm(role_raw)
            if normalized:
                data["role"] = normalized
        exp = data.get("experience_years")
        if exp is not None and isinstance(exp, (int, float)):
            data["experience_years"] = int(exp) if 0 <= exp <= 50 else None
        else:
            data["experience_years"] = None

        def _clean(s: Any, max_len: int = 0) -> str | None:
            if s is None:
                return None
            out = (str(s) or "").strip()
            if not out:
                return None
            if max_len and len(out) > max_len:
                out = out[: max_len - 3].rstrip() + "..."
            return out

        return {
            "full_name": _clean(data.get("full_name")),
            "phone": _clean(data.get("phone")),
            "linkedin_url": _clean(data.get("linkedin_url")),
            "role": _clean(data.get("role")),
            "experience_years": data.get("experience_years"),
            "current_company": _clean(data.get("current_company")),
            "skills_summary": _clean(data.get("skills_summary"), MAX_SKILLS_SUMMARY_LENGTH),
            "education_summary": _clean(data.get("education_summary"), MAX_EDUCATION_SUMMARY_LENGTH),
        }
    except Exception as e:
        logger.exception("LLM CV profile extraction failed: %s", e)
        return {}
