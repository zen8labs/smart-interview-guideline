"""Factory for OpenAI-compatible API client (supports custom base_url)."""

from openai import AsyncOpenAI

from app.config import settings


def get_openai_client() -> AsyncOpenAI:
    """
    Return an AsyncOpenAI client with optional custom base_url.
    Set OPENAI_BASE_URL in env for OpenAI-compatible endpoints (Azure, local, etc.).
    """
    base_url = (settings.openai.base_url or "").strip() or None
    return AsyncOpenAI(api_key=settings.openai.api_key, base_url=base_url)
