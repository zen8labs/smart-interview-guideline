"""Roadmap API views."""

from datetime import date, datetime

from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from app.modules.roadmap.models import (
    DailyRoadmapResponse,
    DailyTask,
    DailyTaskResponse,
    Roadmap,
)
from app.utils.auth import CurrentUser
from app.utils.db import DBSession

router = APIRouter(prefix="/api/roadmap", tags=["roadmap"])


@router.get("/daily", response_model=DailyRoadmapResponse)
async def get_daily_roadmap(
    session: DBSession,
    current_user: CurrentUser,
) -> DailyRoadmapResponse:
    """
    Lấy tasks "hôm nay" từ roadmap mới nhất của user.
    Roadmap chỉ có sau khi user hoàn thành memory scan (bước 3).
    """
    result = await session.exec(
        select(Roadmap)
        .where(Roadmap.user_id == current_user.id)
        .order_by(Roadmap.created_at.desc())
        .limit(1)
    )
    roadmap = result.first()

    if not roadmap:
        return DailyRoadmapResponse(
            roadmap_id=0,
            day_index=0,
            tasks=[],
        )

    # Today's day_index: days since roadmap creation
    created = roadmap.created_at.date() if hasattr(roadmap.created_at, "date") else roadmap.created_at
    if isinstance(created, datetime):
        created = created.date()
    today = date.today()
    day_index = max(0, (today - created).days)

    result = await session.exec(
        select(DailyTask)
        .where(DailyTask.roadmap_id == roadmap.id)
        .where(DailyTask.day_index == day_index)
        .order_by(DailyTask.sort_order)
    )
    tasks = result.all()

    return DailyRoadmapResponse(
        roadmap_id=roadmap.id,
        day_index=day_index,
        tasks=[DailyTaskResponse.model_validate(t) for t in tasks],
    )


@router.post("/task/{task_id}/complete")
async def complete_task(
    task_id: int,
    session: DBSession,
    current_user: CurrentUser,
) -> DailyTaskResponse:
    """Mark a daily task as completed."""
    task = await session.get(DailyTask, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    roadmap = await session.get(Roadmap, task.roadmap_id)
    if not roadmap or roadmap.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    task.is_completed = True
    task.completed_at = datetime.utcnow()
    session.add(task)
    await session.commit()
    await session.refresh(task)

    return DailyTaskResponse.model_validate(task)
