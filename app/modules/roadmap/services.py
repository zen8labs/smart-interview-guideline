"""Pathfinder: map JD analysis gaps + time -> daily task list."""

from datetime import date, datetime, timedelta
from typing import Any

from app.modules.analysis.models import JDAnalysis
from app.modules.roadmap.models import DailyTask, Roadmap
from sqlmodel.ext.asyncio.session import AsyncSession


async def create_roadmap_from_analysis(
    session: AsyncSession,
    *,
    user_id: int,
    jd_analysis: JDAnalysis,
) -> Roadmap:
    """
    Create a roadmap and daily tasks from a JD analysis (pathfinder).
    Uses extracted keywords to generate placeholder learning tasks.
    """
    roadmap = Roadmap(
        user_id=user_id,
        jd_analysis_id=jd_analysis.id,
        interview_date=jd_analysis.interview_date,
    )
    session.add(roadmap)
    await session.flush()

    skills = jd_analysis.extracted_keywords.get("skills") or []
    domains = jd_analysis.extracted_keywords.get("domains") or []
    keywords = jd_analysis.extracted_keywords.get("keywords") or []

    # Build list of topics (skills first, then domains, then keywords; max 10)
    topics = list(skills)[:5] + list(domains)[:3] + list(keywords)[:2]
    if not topics:
        topics = ["Core concepts", "Technical skills", "Best practices"]

    for day_index, topic in enumerate(topics[:10]):
        task = DailyTask(
            roadmap_id=roadmap.id,
            day_index=day_index,
            title=f"Learn: {topic}",
            content=f"Focus on **{topic}** today. Review related concepts and practice.",
            content_type="text",
            sort_order=day_index,
        )
        session.add(task)

    await session.commit()
    await session.refresh(roadmap)
    return roadmap
