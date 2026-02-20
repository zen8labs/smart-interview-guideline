"""Question and Knowledge Warehouse models."""

import enum
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator
from sqlmodel import Column, Field as SQLField, JSON, Relationship, SQLModel


# Enums

class QuestionType(str, enum.Enum):
    """Question types."""
    
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"
    SCENARIO = "scenario"
    CODING = "coding"


class DifficultyLevel(str, enum.Enum):
    """Difficulty levels for questions and knowledge."""
    
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class ContentStatus(str, enum.Enum):
    """Content status for questions and knowledge."""
    
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"


class SourceType(str, enum.Enum):
    """Source type for content creation."""
    
    ON_FLY = "on_fly"
    ADMIN_CURATED = "admin_curated"
    USER_CONTRIBUTED = "user_contributed"
    CROWDSOURCED = "crowdsourced"


class LinkType(str, enum.Enum):
    """Link type between questions and knowledge."""
    
    PREREQUISITE = "prerequisite"
    REMEDIAL = "remedial"
    ADVANCED = "advanced"
    RELATED = "related"


class SkillCategory(str, enum.Enum):
    """Skill taxonomy categories."""
    
    PROGRAMMING_LANGUAGE = "programming_language"
    FRAMEWORK = "framework"
    CONCEPT = "concept"
    TOOL = "tool"
    METHODOLOGY = "methodology"
    DOMAIN = "domain"


class ContentType(str, enum.Enum):
    """Knowledge content types."""
    
    CONCEPT = "concept"
    TUTORIAL = "tutorial"
    EXAMPLE = "example"
    TIPS = "tips"
    VISUALIZATION = "visualization"


# Database Models

class SkillTaxonomy(SQLModel, table=True):
    """Skill taxonomy for organizing questions and knowledge."""
    
    __tablename__ = "skill_taxonomy"
    
    id: int | None = SQLField(default=None, primary_key=True)
    name: str = SQLField(max_length=255, unique=True, index=True)
    slug: str = SQLField(max_length=255, unique=True, index=True)
    category: str = SQLField(max_length=50, index=True)
    parent_skill_id: int | None = SQLField(default=None, foreign_key="skill_taxonomy.id")
    description: str | None = SQLField(default=None)
    is_active: bool = SQLField(default=True, index=True)
    created_at: datetime = SQLField(default_factory=datetime.utcnow)
    updated_at: datetime = SQLField(default_factory=datetime.utcnow)


class Question(SQLModel, table=True):
    """Question model for interview questions."""
    
    __tablename__ = "questions"
    
    id: int | None = SQLField(default=None, primary_key=True)
    title: str = SQLField(max_length=255, index=True)
    content: str = SQLField()  # The actual question text
    question_type: str = SQLField(max_length=50, index=True)
    options: dict[str, Any] = SQLField(sa_column=Column(JSON))  # JSON structure depends on question_type
    difficulty: str = SQLField(max_length=50, index=True)
    estimated_time_seconds: int | None = SQLField(default=None)
    explanation: str | None = SQLField(default=None)
    status: str = SQLField(max_length=50, default=ContentStatus.DRAFT.value, index=True)
    is_official: bool = SQLField(default=False, index=True)
    source_type: str = SQLField(max_length=50, default=SourceType.ADMIN_CURATED.value, index=True)
    created_by_user_id: int = SQLField(foreign_key="users.id")
    approved_by_admin_id: int | None = SQLField(default=None, foreign_key="users.id")
    tags: list[str] = SQLField(sa_column=Column(JSON), default_factory=list)
    version: int = SQLField(default=1)
    created_at: datetime = SQLField(default_factory=datetime.utcnow)
    updated_at: datetime = SQLField(default_factory=datetime.utcnow)
    deleted_at: datetime | None = SQLField(default=None)  # Soft delete


class Knowledge(SQLModel, table=True):
    """Knowledge article model for learning content."""
    
    __tablename__ = "knowledge"
    
    id: int | None = SQLField(default=None, primary_key=True)
    title: str = SQLField(max_length=255, index=True)
    slug: str = SQLField(max_length=255, unique=True, index=True)
    content: str = SQLField()  # Markdown format
    summary: str = SQLField(max_length=500)
    content_type: str = SQLField(max_length=50, index=True)
    difficulty: str = SQLField(max_length=50, index=True)
    estimated_read_time_minutes: int | None = SQLField(default=None)
    visual_content: dict[str, Any] | None = SQLField(sa_column=Column(JSON), default=None)
    references: list[dict[str, str]] = SQLField(sa_column=Column(JSON), default_factory=list)
    status: str = SQLField(max_length=50, default=ContentStatus.DRAFT.value, index=True)
    is_official: bool = SQLField(default=False, index=True)
    source_type: str = SQLField(max_length=50, default=SourceType.ADMIN_CURATED.value, index=True)
    created_by_user_id: int = SQLField(foreign_key="users.id")
    approved_by_admin_id: int | None = SQLField(default=None, foreign_key="users.id")
    view_count: int = SQLField(default=0)
    tags: list[str] = SQLField(sa_column=Column(JSON), default_factory=list)
    version: int = SQLField(default=1)
    created_at: datetime = SQLField(default_factory=datetime.utcnow)
    updated_at: datetime = SQLField(default_factory=datetime.utcnow)
    deleted_at: datetime | None = SQLField(default=None)  # Soft delete


class QuestionSkill(SQLModel, table=True):
    """Many-to-many relationship between questions and skills."""
    
    __tablename__ = "question_skills"
    
    id: int | None = SQLField(default=None, primary_key=True)
    question_id: int = SQLField(foreign_key="questions.id", index=True)
    skill_id: int = SQLField(foreign_key="skill_taxonomy.id", index=True)
    relevance_score: float = SQLField(default=1.0)  # 0.0-1.0
    created_at: datetime = SQLField(default_factory=datetime.utcnow)


class KnowledgeSkill(SQLModel, table=True):
    """Many-to-many relationship between knowledge and skills."""
    
    __tablename__ = "knowledge_skills"
    
    id: int | None = SQLField(default=None, primary_key=True)
    knowledge_id: int = SQLField(foreign_key="knowledge.id", index=True)
    skill_id: int = SQLField(foreign_key="skill_taxonomy.id", index=True)
    relevance_score: float = SQLField(default=1.0)  # 0.0-1.0
    created_at: datetime = SQLField(default_factory=datetime.utcnow)


class QuestionKnowledgeLink(SQLModel, table=True):
    """Direct linking between questions and knowledge articles."""
    
    __tablename__ = "question_knowledge_links"
    
    id: int | None = SQLField(default=None, primary_key=True)
    question_id: int = SQLField(foreign_key="questions.id", index=True)
    knowledge_id: int = SQLField(foreign_key="knowledge.id", index=True)
    link_type: str = SQLField(max_length=50, index=True)
    relevance_score: float = SQLField(default=1.0)  # 0.0-1.0
    created_by: str = SQLField(max_length=50, default="admin")  # 'auto', 'admin', 'algorithm'
    created_at: datetime = SQLField(default_factory=datetime.utcnow)


class UserContribution(SQLModel, table=True):
    """Track user contributions for reputation system."""

    __tablename__ = "user_contributions"

    id: int | None = SQLField(default=None, primary_key=True)
    user_id: int = SQLField(foreign_key="users.id", index=True)
    content_type: str = SQLField(max_length=50)  # 'question' or 'knowledge'
    content_id: int = SQLField(index=True)  # Polymorphic reference
    contribution_date: datetime = SQLField(default_factory=datetime.utcnow)
    review_status: str = SQLField(max_length=50, default="pending", index=True)
    admin_feedback: str | None = SQLField(default=None)
    reward_credits: int = SQLField(default=0)
    reviewed_at: datetime | None = SQLField(default=None)
    reviewed_by_admin_id: int | None = SQLField(default=None, foreign_key="users.id")


class AssessmentSession(SQLModel, table=True):
    """User assessment or practice session (Memory Scan / Knowledge Check)."""

    __tablename__ = "assessment_sessions"

    id: int | None = SQLField(default=None, primary_key=True)
    user_id: int = SQLField(foreign_key="users.id", index=True)
    preparation_id: int | None = SQLField(
        default=None, foreign_key="preparations.id", index=True
    )
    session_type: str = SQLField(max_length=50, index=True)  # memory_scan | knowledge_check
    score_percent: float | None = SQLField(default=None)
    created_at: datetime = SQLField(default_factory=datetime.utcnow)


class UserQuestionAnswer(SQLModel, table=True):
    """User's answer to a question within a session."""

    __tablename__ = "user_question_answers"

    id: int | None = SQLField(default=None, primary_key=True)
    session_id: int = SQLField(foreign_key="assessment_sessions.id", index=True)
    question_id: int | None = SQLField(
        default=None, foreign_key="questions.id", index=True
    )  # None khi câu từ AI (memory scan JSON)
    selected_answer: str = SQLField(max_length=500)
    is_correct: bool = SQLField(default=False)
    created_at: datetime = SQLField(default_factory=datetime.utcnow)


# Request/Response Schemas

class QuestionCreate(BaseModel):
    """Schema for creating a question."""
    
    title: str = Field(max_length=255)
    content: str
    question_type: QuestionType
    options: dict[str, Any]
    difficulty: DifficultyLevel
    estimated_time_seconds: int | None = None
    explanation: str | None = None
    tags: list[str] = Field(default_factory=list)
    skill_ids: list[int] = Field(default_factory=list)
    
    @field_validator("options")
    @classmethod
    def validate_options(cls, v: dict[str, Any]) -> dict[str, Any]:
        """Validate options structure based on question type."""
        if not v:
            raise ValueError("Options cannot be empty")
        return v


class QuestionUpdate(BaseModel):
    """Schema for updating a question."""
    
    title: str | None = None
    content: str | None = None
    question_type: QuestionType | None = None
    options: dict[str, Any] | None = None
    difficulty: DifficultyLevel | None = None
    estimated_time_seconds: int | None = None
    explanation: str | None = None
    tags: list[str] | None = None
    skill_ids: list[int] | None = None


class QuestionResponse(BaseModel):
    """Schema for question response."""
    
    id: int
    title: str
    content: str
    question_type: str
    options: dict[str, Any]
    difficulty: str
    estimated_time_seconds: int | None
    explanation: str | None
    status: str
    is_official: bool
    source_type: str
    created_by_user_id: int
    approved_by_admin_id: int | None
    tags: list[str]
    version: int
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class QuestionListResponse(BaseModel):
    """Schema for paginated question list."""
    
    total: int
    page: int
    page_size: int
    items: list[QuestionResponse]


class SkillCreate(BaseModel):
    """Schema for creating a skill."""
    
    name: str = Field(max_length=255)
    slug: str = Field(max_length=255)
    category: SkillCategory
    parent_skill_id: int | None = None
    description: str | None = None


class SkillUpdate(BaseModel):
    """Schema for updating a skill."""
    
    name: str | None = None
    slug: str | None = None
    category: SkillCategory | None = None
    parent_skill_id: int | None = None
    description: str | None = None
    is_active: bool | None = None


class SkillResponse(BaseModel):
    """Schema for skill response."""
    
    id: int
    name: str
    slug: str
    category: str
    parent_skill_id: int | None
    description: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class QuestionSkillCreate(BaseModel):
    """Schema for linking question to skill."""
    
    question_id: int
    skill_id: int
    relevance_score: float = Field(default=1.0, ge=0.0, le=1.0)


class QuestionKnowledgeLinkCreate(BaseModel):
    """Schema for linking question to knowledge."""
    
    question_id: int
    knowledge_id: int
    link_type: LinkType
    relevance_score: float = Field(default=1.0, ge=0.0, le=1.0)


class BulkApproveRequest(BaseModel):
    """Schema for bulk approve operation."""
    
    question_ids: list[int]


class BulkRejectRequest(BaseModel):
    """Schema for bulk reject operation."""
    
    question_ids: list[int]
    feedback: str | None = None


class QuestionFilterParams(BaseModel):
    """Schema for question filtering parameters."""

    status: list[str] | None = None
    question_type: list[str] | None = None
    difficulty: list[str] | None = None
    skill_ids: list[int] | None = None
    tags: list[str] | None = None
    source_type: list[str] | None = None
    is_official: bool | None = None
    created_by_user_id: int | None = None
    search: str | None = None
    sort_by: str = "created_at"
    sort_order: str = "desc"
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


# User-facing (practice/assessment) schemas

class UserQuestionItem(BaseModel):
    """Question item for user display (options without correct_answer)."""

    id: int
    title: str
    content: str
    question_type: str
    options: dict[str, Any]  # Frontend receives options; correct_answer stripped
    difficulty: str
    estimated_time_seconds: int | None
    tags: list[str]

    model_config = {"from_attributes": True}


class AnswerSubmitItem(BaseModel):
    """Single answer submission."""

    question_id: int
    selected_answer: str


class SubmitAnswersRequest(BaseModel):
    """Request body for submitting assessment answers."""

    session_type: str  # memory_scan | knowledge_check
    answers: list[AnswerSubmitItem]


class SubmitAnswersResponse(BaseModel):
    """Response after submitting answers."""

    session_id: int
    score_percent: float
    total_questions: int
    correct_count: int
