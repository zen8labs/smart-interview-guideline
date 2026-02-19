"""Question warehouse API views."""

from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlmodel import col

from app.modules.account.models import User
from app.utils.auth import AdminUser, CurrentUser
from app.utils.db import DBSession

from .models import (
    BulkApproveRequest,
    BulkRejectRequest,
    ContentStatus,
    Question,
    QuestionCreate,
    QuestionFilterParams,
    QuestionKnowledgeLink,
    QuestionKnowledgeLinkCreate,
    QuestionListResponse,
    QuestionResponse,
    QuestionSkill,
    QuestionSkillCreate,
    QuestionUpdate,
    SkillTaxonomy,
)

router = APIRouter(prefix="/api/admin/questions", tags=["questions"])


@router.post("", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question(
    question_data: QuestionCreate,
    session: DBSession,
    current_user: CurrentUser,
) -> Question:
    """Create a new question (admin or user contribution)."""
    # Create question
    question = Question(
        title=question_data.title,
        content=question_data.content,
        question_type=question_data.question_type.value,
        options=question_data.options,
        difficulty=question_data.difficulty.value,
        estimated_time_seconds=question_data.estimated_time_seconds,
        explanation=question_data.explanation,
        tags=question_data.tags,
        created_by_user_id=current_user.id,
        status=ContentStatus.APPROVED.value if current_user.is_admin else ContentStatus.PENDING_REVIEW.value,
        approved_by_admin_id=current_user.id if current_user.is_admin else None,
    )
    
    session.add(question)
    await session.commit()
    await session.refresh(question)
    
    # Link skills if provided
    if question_data.skill_ids:
        for skill_id in question_data.skill_ids:
            # Verify skill exists
            skill = await session.get(SkillTaxonomy, skill_id)
            if not skill:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Skill with id {skill_id} not found"
                )
            
            question_skill = QuestionSkill(
                question_id=question.id,
                skill_id=skill_id,
                relevance_score=1.0,
            )
            session.add(question_skill)
        
        await session.commit()
    
    return question


@router.get("", response_model=QuestionListResponse)
async def list_questions(
    session: DBSession,
    current_user: AdminUser,
    status_filter: list[str] | None = Query(None, alias="status"),
    question_type: list[str] | None = Query(None),
    difficulty: list[str] | None = Query(None),
    skill_ids: list[int] | None = Query(None),
    tags: list[str] | None = Query(None),
    source_type: list[str] | None = Query(None),
    is_official: bool | None = Query(None),
    created_by_user_id: int | None = Query(None),
    search: str | None = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> dict[str, Any]:
    """List questions with filtering, sorting, and pagination."""
    # Build query
    query = select(Question).where(col(Question.deleted_at).is_(None))
    
    # Apply filters
    if status_filter:
        query = query.where(col(Question.status).in_(status_filter))
    
    if question_type:
        query = query.where(col(Question.question_type).in_(question_type))
    
    if difficulty:
        query = query.where(col(Question.difficulty).in_(difficulty))
    
    if source_type:
        query = query.where(col(Question.source_type).in_(source_type))
    
    if is_official is not None:
        query = query.where(Question.is_official == is_official)
    
    if created_by_user_id:
        query = query.where(Question.created_by_user_id == created_by_user_id)
    
    # Search in title, content, and tags
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                col(Question.title).ilike(search_pattern),
                col(Question.content).ilike(search_pattern),
            )
        )
    
    # Filter by skills
    if skill_ids:
        query = query.join(QuestionSkill).where(col(QuestionSkill.skill_id).in_(skill_ids))
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await session.execute(count_query)
    total = total_result.scalar_one()
    
    # Apply sorting
    if sort_order == "asc":
        query = query.order_by(getattr(Question, sort_by).asc())
    else:
        query = query.order_by(getattr(Question, sort_by).desc())
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    # Execute query
    result = await session.execute(query)
    questions = result.scalars().all()
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": questions,
    }


@router.get("/{question_id}", response_model=QuestionResponse)
async def get_question(
    question_id: int,
    session: DBSession,
    current_user: AdminUser,
) -> Question:
    """Get a specific question by ID."""
    question = await session.get(Question, question_id)
    
    if not question or question.deleted_at:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    return question


@router.put("/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: int,
    question_data: QuestionUpdate,
    session: DBSession,
    current_user: AdminUser,
) -> Question:
    """Update an existing question."""
    question = await session.get(Question, question_id)
    
    if not question or question.deleted_at:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # Update fields
    update_data = question_data.model_dump(exclude_unset=True, exclude={"skill_ids"})
    
    # Convert enums to values
    if "question_type" in update_data and update_data["question_type"]:
        update_data["question_type"] = update_data["question_type"].value
    if "difficulty" in update_data and update_data["difficulty"]:
        update_data["difficulty"] = update_data["difficulty"].value
    
    for key, value in update_data.items():
        setattr(question, key, value)
    
    question.updated_at = datetime.utcnow()
    question.version += 1
    
    # Update skills if provided
    if question_data.skill_ids is not None:
        # Remove existing skills
        delete_stmt = select(QuestionSkill).where(QuestionSkill.question_id == question_id)
        result = await session.execute(delete_stmt)
        existing_skills = result.scalars().all()
        for skill in existing_skills:
            await session.delete(skill)
        
        # Add new skills
        for skill_id in question_data.skill_ids:
            skill = await session.get(SkillTaxonomy, skill_id)
            if not skill:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Skill with id {skill_id} not found"
                )
            
            question_skill = QuestionSkill(
                question_id=question_id,
                skill_id=skill_id,
                relevance_score=1.0,
            )
            session.add(question_skill)
    
    await session.commit()
    await session.refresh(question)
    
    return question


@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    question_id: int,
    session: DBSession,
    current_user: AdminUser,
) -> None:
    """Soft delete a question."""
    question = await session.get(Question, question_id)
    
    if not question or question.deleted_at:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # Soft delete
    question.deleted_at = datetime.utcnow()
    await session.commit()


@router.patch("/{question_id}/approve", response_model=QuestionResponse)
async def approve_question(
    question_id: int,
    session: DBSession,
    current_user: AdminUser,
) -> Question:
    """Approve a pending question."""
    question = await session.get(Question, question_id)
    
    if not question or question.deleted_at:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    question.status = ContentStatus.APPROVED.value
    question.approved_by_admin_id = current_user.id
    question.updated_at = datetime.utcnow()
    
    await session.commit()
    await session.refresh(question)
    
    return question


@router.patch("/{question_id}/reject", response_model=QuestionResponse)
async def reject_question(
    question_id: int,
    session: DBSession,
    current_user: AdminUser,
    feedback: str | None = None,
) -> Question:
    """Reject a pending question."""
    question = await session.get(Question, question_id)
    
    if not question or question.deleted_at:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    question.status = ContentStatus.REJECTED.value
    question.updated_at = datetime.utcnow()
    
    # Store feedback in user contribution record if exists
    # (Implementation depends on UserContribution tracking)
    
    await session.commit()
    await session.refresh(question)
    
    return question


@router.patch("/{question_id}/promote", response_model=QuestionResponse)
async def promote_to_official(
    question_id: int,
    session: DBSession,
    current_user: AdminUser,
) -> Question:
    """Promote a question to official status."""
    question = await session.get(Question, question_id)
    
    if not question or question.deleted_at:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    if question.status != ContentStatus.APPROVED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only approved questions can be promoted to official"
        )
    
    question.is_official = True
    question.updated_at = datetime.utcnow()
    
    await session.commit()
    await session.refresh(question)
    
    return question


@router.post("/{question_id}/link-knowledge", status_code=status.HTTP_201_CREATED)
async def link_question_to_knowledge(
    question_id: int,
    link_data: QuestionKnowledgeLinkCreate,
    session: DBSession,
    current_user: AdminUser,
) -> dict[str, str]:
    """Link a question to a knowledge article."""
    # Verify question exists
    question = await session.get(Question, question_id)
    if not question or question.deleted_at:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # Verify knowledge exists (will be implemented in knowledge module)
    # For now, just create the link
    
    # Check if link already exists
    existing_link_query = select(QuestionKnowledgeLink).where(
        QuestionKnowledgeLink.question_id == question_id,
        QuestionKnowledgeLink.knowledge_id == link_data.knowledge_id,
    )
    result = await session.execute(existing_link_query)
    existing_link = result.scalar_one_or_none()
    
    if existing_link:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Link already exists"
        )
    
    # Create link
    link = QuestionKnowledgeLink(
        question_id=question_id,
        knowledge_id=link_data.knowledge_id,
        link_type=link_data.link_type.value,
        relevance_score=link_data.relevance_score,
        created_by="admin",
    )
    
    session.add(link)
    await session.commit()
    
    return {"message": "Link created successfully"}


@router.post("/bulk-approve", response_model=dict[str, Any])
async def bulk_approve_questions(
    request: BulkApproveRequest,
    session: DBSession,
    current_user: AdminUser,
) -> dict[str, Any]:
    """Bulk approve multiple questions."""
    approved_count = 0
    
    for question_id in request.question_ids:
        question = await session.get(Question, question_id)
        if question and not question.deleted_at:
            question.status = ContentStatus.APPROVED.value
            question.approved_by_admin_id = current_user.id
            question.updated_at = datetime.utcnow()
            approved_count += 1
    
    await session.commit()
    
    return {
        "message": f"Successfully approved {approved_count} questions",
        "approved_count": approved_count,
    }


@router.post("/bulk-reject", response_model=dict[str, Any])
async def bulk_reject_questions(
    request: BulkRejectRequest,
    session: DBSession,
    current_user: AdminUser,
) -> dict[str, Any]:
    """Bulk reject multiple questions."""
    rejected_count = 0
    
    for question_id in request.question_ids:
        question = await session.get(Question, question_id)
        if question and not question.deleted_at:
            question.status = ContentStatus.REJECTED.value
            question.updated_at = datetime.utcnow()
            rejected_count += 1
    
    await session.commit()
    
    return {
        "message": f"Successfully rejected {rejected_count} questions",
        "rejected_count": rejected_count,
    }


@router.post("/{question_id}/assign-skills", status_code=status.HTTP_201_CREATED)
async def assign_skills_to_question(
    question_id: int,
    skill_ids: list[int],
    session: DBSession,
    current_user: AdminUser,
) -> dict[str, str]:
    """Assign multiple skills to a question."""
    # Verify question exists
    question = await session.get(Question, question_id)
    if not question or question.deleted_at:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # Remove existing skills
    delete_stmt = select(QuestionSkill).where(QuestionSkill.question_id == question_id)
    result = await session.execute(delete_stmt)
    existing_skills = result.scalars().all()
    for skill in existing_skills:
        await session.delete(skill)
    
    # Add new skills
    for skill_id in skill_ids:
        skill = await session.get(SkillTaxonomy, skill_id)
        if not skill:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Skill with id {skill_id} not found"
            )
        
        question_skill = QuestionSkill(
            question_id=question_id,
            skill_id=skill_id,
            relevance_score=1.0,
        )
        session.add(question_skill)
    
    await session.commit()
    
    return {"message": "Skills assigned successfully"}


@router.get("/{question_id}/skills", response_model=list[dict[str, Any]])
async def get_question_skills(
    question_id: int,
    session: DBSession,
    current_user: AdminUser,
) -> list[dict[str, Any]]:
    """Get all skills assigned to a question."""
    # Verify question exists
    question = await session.get(Question, question_id)
    if not question or question.deleted_at:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # Get skills
    query = (
        select(SkillTaxonomy, QuestionSkill.relevance_score)
        .join(QuestionSkill, QuestionSkill.skill_id == SkillTaxonomy.id)
        .where(QuestionSkill.question_id == question_id)
    )
    
    result = await session.execute(query)
    skills_data = result.all()
    
    return [
        {
            "id": skill.id,
            "name": skill.name,
            "slug": skill.slug,
            "category": skill.category,
            "relevance_score": relevance_score,
        }
        for skill, relevance_score in skills_data
    ]


@router.get("/{question_id}/knowledge-links", response_model=list[dict[str, Any]])
async def get_question_knowledge_links(
    question_id: int,
    session: DBSession,
    current_user: AdminUser,
) -> list[dict[str, Any]]:
    """Get all knowledge articles linked to a question."""
    # Verify question exists
    question = await session.get(Question, question_id)
    if not question or question.deleted_at:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # Get links
    query = select(QuestionKnowledgeLink).where(
        QuestionKnowledgeLink.question_id == question_id
    )
    
    result = await session.execute(query)
    links = result.scalars().all()
    
    return [
        {
            "id": link.id,
            "knowledge_id": link.knowledge_id,
            "link_type": link.link_type,
            "relevance_score": link.relevance_score,
            "created_by": link.created_by,
            "created_at": link.created_at,
        }
        for link in links
    ]
