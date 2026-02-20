"""JD analysis services: file parsing and LLM keyword extraction."""

import io
import json
import logging
import re
from pathlib import Path
from typing import Any

from docx import Document as DocxDocument
from openai import AsyncOpenAI
from pypdf import PdfReader
import httpx

from app.config import settings

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


async def extract_keywords_with_llm(text: str) -> dict[str, Any]:
    """
    Use OpenAI to extract skills and domain keywords from JD text.

    Returns a dict with keys such as "skills", "domains", "keywords".
    """
    if not text or not text.strip():
        return {"skills": [], "domains": [], "keywords": []}

    if not settings.openai.api_key:
        logger.warning("OPENAI_API_KEY not set; returning placeholder keywords")
        return {
            "skills": ["Python", "FastAPI", "SQL"],
            "domains": ["Backend", "Web"],
            "keywords": ["API", "database"],
        }

    truncated = text[:MAX_JD_TEXT_LENGTH]
    if len(text) > MAX_JD_TEXT_LENGTH:
        truncated += "\n\n[Text truncated for analysis.]"

    client = AsyncOpenAI(api_key=settings.openai.api_key)
    prompt = """Analyze the following job description and extract key information as JSON.
Return ONLY a valid JSON object with exactly these keys:
- "skills": array of required technical skills (e.g. "Python", "React", "SQL")
- "domains": array of domains/areas (e.g. "Backend", "Frontend", "DevOps")
- "keywords": array of other important keywords (technologies, concepts)

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
        return {
            "skills": data.get("skills", []) if isinstance(data.get("skills"), list) else [],
            "domains": data.get("domains", []) if isinstance(data.get("domains"), list) else [],
            "keywords": data.get("keywords", []) if isinstance(data.get("keywords"), list) else [],
        }
    except Exception as e:
        logger.exception("LLM keyword extraction failed: %s", e)
        return {"skills": [], "domains": [], "keywords": [], "error": str(e)}
