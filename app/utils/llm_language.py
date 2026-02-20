"""Helper to build LLM language instructions from user preferred_language."""

# Map language code to instruction for generated content (questions, roadmap, summaries).
# Used in all LLM prompts so output matches the user's UI language.
LLM_LANGUAGE_INSTRUCTIONS: dict[str, str] = {
    "vi": "Write all output in Vietnamese.",
    "en": "Write all output in English.",
}


def get_language_instruction(preferred_language: str | None) -> str:
    """
    Return the instruction line to add to LLM prompts so generated content
    is in the user's preferred language.

    Args:
        preferred_language: User's preferred_language (e.g. 'en', 'vi'). None or unknown -> English.

    Returns:
        A line like "Write all output in English." or "Write all output in Vietnamese."
    """
    if preferred_language and preferred_language.strip():
        code = preferred_language.strip().lower()[:10]
        return LLM_LANGUAGE_INSTRUCTIONS.get(code, LLM_LANGUAGE_INSTRUCTIONS["en"])
    return LLM_LANGUAGE_INSTRUCTIONS["en"]
