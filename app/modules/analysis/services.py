"""JD analysis services: file parsing and LLM keyword extraction."""

import io
import json
import logging
import re
from pathlib import Path
from typing import Any

from docx import Document as DocxDocument
from pypdf import PdfReader
import httpx

from app.config import settings
from app.utils.llm_language import get_language_instruction
from app.utils.openai_client import get_openai_client

logger = logging.getLogger(__name__)

ALLOWED_JD_EXTENSIONS = {".pdf", ".docx", ".txt"}
MAX_JD_TEXT_LENGTH = 50_000  # truncate for LLM context
LINKEDIN_JD_URL_PATTERN = re.compile(
    r"^https?://(www\.)?linkedin\.com/jobs/view/\d+",
    re.IGNORECASE,
)


async def fetch_text_from_url(url: str) -> str:
    """
    Fetch URL and extract visible text from HTML (strip tags, collapse whitespace).
    Used for LinkedIn JD URLs; may return login wall or partial content if site blocks.
    """
    try:
        async with httpx.AsyncClient(
            follow_redirects=True,
            timeout=15.0,
            headers={"User-Agent": "Mozilla/5.0 (compatible; SIG-JD-Fetcher/1.0)"},
        ) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            html = resp.text
    except Exception as e:
        logger.warning("Fetch URL failed %s: %s", url, e)
        raise ValueError(f"Could not fetch URL: {e}") from e

    # Simple tag strip and whitespace collapse
    text = re.sub(r"<script[^>]*>[\s\S]*?</script>", " ", html, flags=re.IGNORECASE)
    text = re.sub(r"<style[^>]*>[\s\S]*?</style>", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    text = text.strip()
    return text[:MAX_JD_TEXT_LENGTH] if text else ""


def extract_text_from_file(*, content: bytes, filename: str) -> str:
    """
    Extract plain text from uploaded file (PDF, DOCX, TXT).

    Args:
        content: Raw file bytes.
        filename: Original filename (used for extension).

    Returns:
        Extracted text.

    Raises:
        ValueError: If file type is not supported.
    """
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_JD_EXTENSIONS:
        raise ValueError(f"Unsupported file type: {ext}. Allowed: {ALLOWED_JD_EXTENSIONS}")

    if ext == ".pdf":
        reader = PdfReader(io.BytesIO(content))
        parts = []
        for page in reader.pages:
            parts.append(page.extract_text() or "")
        return "\n".join(parts).strip()

    if ext == ".docx":
        doc = DocxDocument(io.BytesIO(content))
        return "\n".join(p.text for p in doc.paragraphs).strip()

    if ext == ".txt":
        return content.decode("utf-8", errors="replace").strip()

    raise ValueError(f"Unsupported file type: {ext}")


def _normalize_item_to_name(item: Any) -> str:
    """From extracted_keywords entry (string or object with name/term), return display name."""
    if isinstance(item, str):
        return item
    if isinstance(item, dict):
        return item.get("name") or item.get("term") or str(item)
    return str(item)


def normalize_extracted_keyword_names(extracted: dict[str, Any]) -> tuple[list[str], list[str], list[str]]:
    """
    From extracted_keywords (skills/domains/keywords as list of strings or list of objects),
    return (skills_names, domains_names, keywords_terms) as list of strings for backward compat.
    """
    skills = extracted.get("skills") or []
    domains = extracted.get("domains") or []
    keywords = extracted.get("keywords") or []
    return (
        [_normalize_item_to_name(s) for s in skills],
        [_normalize_item_to_name(d) for d in domains],
        [_normalize_item_to_name(k) for k in keywords],
    )


def _build_user_profile_block(profile: dict[str, Any]) -> str:
    """Build a short text block describing the user profile for LLM context."""
    parts = []
    if profile.get("role"):
        parts.append(f"Role: {profile['role']}")
    if profile.get("experience_years") is not None:
        parts.append(f"Experience: {profile['experience_years']} years")
    if profile.get("skills_summary"):
        parts.append(f"Skills: {profile['skills_summary'][:500]}")
    if profile.get("current_company"):
        parts.append(f"Current company: {profile['current_company']}")
    return "; ".join(parts) if parts else "Not provided"


async def extract_keywords_with_llm(
    text: str,
    preferred_language: str | None = None,
    user_profile: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Use OpenAI to extract structured job requirements from JD text.

    Returns a dict with:
    - skills, domains, keywords, requirements_summary (as before)
    - meta: optional { company_name?, job_title?, location?, posted_date?, application_deadline?, employment_type? }
    - profile_fit: optional { level: 1-5, label?, summary? } when user_profile is provided (5-level scale)
    """
    if not text or not text.strip():
        return {"skills": [], "domains": [], "keywords": []}

    if not settings.openai.api_key:
        logger.warning("OPENAI_API_KEY not set; returning placeholder keywords")
        return {
            "skills": [
                {"name": "Python", "level": "required", "constraints": None, "notes": "Backend"},
                {"name": "FastAPI", "level": "preferred", "constraints": None, "notes": "API development"},
                {"name": "SQL", "level": "required", "constraints": None, "notes": "Database"},
            ],
            "domains": [{"name": "Backend", "description": "Web services"}, {"name": "Web", "description": None}],
            "keywords": [{"term": "API", "context": "REST"}, {"term": "database", "context": None}],
        }

    truncated = text[:MAX_JD_TEXT_LENGTH]
    if len(text) > MAX_JD_TEXT_LENGTH:
        truncated += "\n\n[Text truncated for analysis.]"

    lang_instruction = get_language_instruction(preferred_language)
    output_lang_note = (
        "Output language: Return the ENTIRE JSON output in the user's preferred language. "
        "All text fields (skill names, domain names, keyword terms, constraints, notes, descriptions, context, requirements_summary) "
        "must be in that language. If the job description is in a different language, translate the extracted information to the user's preferred language. "
    )
    client = get_openai_client()
    prompt = f"""Analyze the following job description and extract structured information.

{lang_instruction}
{output_lang_note}

Return ONLY a valid JSON object (no markdown, no commentary) with these keys:

- "skills": array of objects. Each object must have:
  - "name": string (skill name, in the user's preferred language; e.g. "Python", "React", "SQL" or translated equivalent)
  - "level": string or null — required level: "required" | "preferred" | "nice-to-have" | "proficient" | "expert" | "basic" (or null if not stated). Use the user's language for these values if not English.
  - "constraints": string or null — e.g. "3+ years", "hands-on" (in user's language)
  - "notes": string or null — brief context from JD (in user's language)

- "domains": array of objects. Each object must have:
  - "name": string (domain/area, in user's language)
  - "description": string or null — short description or focus area (in user's language)

- "keywords": array of objects. Each object must have:
  - "term": string (technology, concept, or keyword, in user's language)
  - "context": string or null — how it appears in the JD (in user's language)

- "requirements_summary": string or null — one short paragraph (2–4 sentences) summarizing the main requirements, must-haves, and level expected, in the user's preferred language.

- "meta": object with optional JD metadata (use null for missing): "company_name", "job_title", "location", "posted_date" (e.g. "2024-01-15" or text), "application_deadline", "employment_type" (e.g. "Full-time", "Part-time", "Contract"). All in the user's preferred language when possible.
"""
    if user_profile:
        profile_block = _build_user_profile_block(user_profile)
        prompt += f"""
- "profile_fit": object comparing this JD to the candidate profile. Scale 1-5: 1=very low match, 2=low, 3=moderate, 4=high, 5=very high match. Include "level" (integer 1-5), "label" (short label in user's language, e.g. "Rất phù hợp"), "summary" (1-2 sentences explaining the match in user's language). Base this on role fit, experience vs requirements, and skills overlap.

Candidate profile: {profile_block}
"""
    prompt += """
Extract all explicitly mentioned or clearly implied skills with their level and constraints when stated. Do not invent requirements not present in the text.

Job description:
"""
    prompt += truncated

    try:
        response = await client.chat.completions.create(
            model=settings.openai.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=settings.openai.max_tokens,
        )
        content = response.choices[0].message.content
        if not content:
            return {"skills": [], "domains": [], "keywords": []}

        # Strip markdown code block if present
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
            return {"skills": [], "domains": [], "keywords": []}

        def _ensure_skills_list(raw: Any) -> list[dict[str, Any]]:
            if not isinstance(raw, list):
                return []
            out = []
            for x in raw:
                if isinstance(x, str):
                    out.append({"name": x, "level": None, "constraints": None, "notes": None})
                elif isinstance(x, dict) and x.get("name"):
                    out.append({
                        "name": x.get("name"),
                        "level": x.get("level"),
                        "constraints": x.get("constraints"),
                        "notes": x.get("notes"),
                    })
            return out

        def _ensure_domains_list(raw: Any) -> list[dict[str, Any]]:
            if not isinstance(raw, list):
                return []
            out = []
            for x in raw:
                if isinstance(x, str):
                    out.append({"name": x, "description": None})
                elif isinstance(x, dict) and x.get("name"):
                    out.append({"name": x.get("name"), "description": x.get("description")})
            return out

        def _ensure_keywords_list(raw: Any) -> list[dict[str, Any]]:
            if not isinstance(raw, list):
                return []
            out = []
            for x in raw:
                if isinstance(x, str):
                    out.append({"term": x, "context": None})
                elif isinstance(x, dict) and x.get("term"):
                    out.append({"term": x.get("term"), "context": x.get("context")})
                elif isinstance(x, dict) and x.get("name"):
                    out.append({"term": x.get("name"), "context": x.get("context")})
            return out

        out: dict[str, Any] = {
            "skills": _ensure_skills_list(data.get("skills")),
            "domains": _ensure_domains_list(data.get("domains")),
            "keywords": _ensure_keywords_list(data.get("keywords")),
            "requirements_summary": data.get("requirements_summary") if isinstance(data.get("requirements_summary"), str) else None,
        }
        # Meta: company, position, location, dates, employment type
        meta_raw = data.get("meta")
        if isinstance(meta_raw, dict):
            out["meta"] = {
                k: v for k, v in meta_raw.items()
                if k in ("company_name", "job_title", "location", "posted_date", "application_deadline", "employment_type")
                and v is not None and str(v).strip()
            }
        else:
            out["meta"] = {}
        # Profile fit: level 1-5 when user_profile was provided
        fit_raw = data.get("profile_fit")
        if isinstance(fit_raw, dict) and fit_raw.get("level") is not None:
            try:
                level = int(fit_raw["level"])
                level = max(1, min(5, level))
                out["profile_fit"] = {
                    "level": level,
                    "label": str(fit_raw.get("label") or "").strip() or None,
                    "summary": str(fit_raw.get("summary") or "").strip() or None,
                }
            except (TypeError, ValueError):
                out["profile_fit"] = None
        else:
            out["profile_fit"] = None
        return out
    except Exception as e:
        logger.exception("LLM keyword extraction failed: %s", e)
        return {"skills": [], "domains": [], "keywords": [], "error": str(e)}


async def extract_jd_content_with_llm(raw_text: str, source: str = "generic") -> str:
    """
    Use LLM to extract or clean job description content from raw text.

    - For LinkedIn: raw text is from HTML scrape (noisy). LLM extracts only the JD body.
    - For file: raw text from PDF/DOCX/TXT may contain only JD or JD + other content; LLM isolates the JD.

    Returns cleaned JD text. If LLM is unavailable or fails, returns raw_text (truncated).
    """
    if not raw_text or not raw_text.strip():
        return raw_text

    if not settings.openai.api_key:
        logger.warning("OPENAI_API_KEY not set; returning raw text without LLM extraction")
        return raw_text[:MAX_JD_TEXT_LENGTH].strip()

    truncated = raw_text[:MAX_JD_TEXT_LENGTH]
    if len(raw_text) > MAX_JD_TEXT_LENGTH:
        truncated += "\n\n[Text truncated for extraction.]"

    if source == "linkedin":
        system = (
            "You are a precise extractor. Given raw text scraped from a LinkedIn job page "
            "(which includes navigation, menus, ads, buttons, and other noise), extract ONLY "
            "the main job posting content: job title, company name, location if present, and "
            "the full job description body. Remove all navigation, 'Apply now', cookie notices, "
            "repeated links, and unrelated text. Preserve paragraphs and structure. "
            "Preserve the original language of the job description. "
            "Return ONLY the extracted job description as plain text, no commentary."
        )
        user = f"Extract the job description from this LinkedIn page text:\n\n{truncated}"
    else:
        # file or generic
        system = (
            "You are a precise extractor. Given text from a document (e.g. PDF/DOCX/TXT) that "
            "may contain a job description and possibly other content, extract and return ONLY "
            "the job description. If the whole document is the JD, clean it: normalize whitespace, "
            "remove obvious artifacts or headers/footers that are not part of the JD. "
            "Preserve the original language of the job description. "
            "Return ONLY the job description as plain text, no commentary."
        )
        user = f"Extract the job description from this document:\n\n{truncated}"

    try:
        client = get_openai_client()
        response = await client.chat.completions.create(
            model=settings.openai.model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.2,
            max_tokens=settings.openai.max_tokens,
        )
        content = response.choices[0].message.content
        if content and content.strip():
            return content.strip()
        return truncated.strip()
    except Exception as e:
        logger.exception("LLM JD extraction failed: %s", e)
        return truncated.strip()
