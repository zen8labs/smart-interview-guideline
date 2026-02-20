"""
Database utilities for SQLModel with async PostgreSQL support.

This module provides:
- Async database engine with connection pooling
- Session management with dependency injection
- Database initialization and lifecycle management
- Type-safe database operations

Best Practices Implemented:
- Async/await for non-blocking I/O
- Connection pooling for performance
- Proper resource cleanup
- Centralized configuration via pydantic-settings
- Type hints for better IDE support
"""

import logging
from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession as SQLModelAsyncSession

from app.config import DatabaseSettings, get_settings

logger = logging.getLogger(__name__)


class Database:
    """
    Database manager for async SQLModel operations.

    This class handles:
    - Engine creation and configuration
    - Connection pooling
    - Session lifecycle management
    - Database initialization
    """

    def __init__(self, config: DatabaseSettings | None = None):
        self.config = config or get_settings().database
        self._engine: AsyncEngine | None = None
        self._session_maker: sessionmaker | None = None

    @property
    def engine(self) -> AsyncEngine:
        """Get the async database engine."""
        if self._engine is None:
            raise RuntimeError(
                "Database engine not initialized. Call init_db() first."
            )
        return self._engine

    @property
    def session_maker(self) -> sessionmaker:
        """Get the session maker."""
        if self._session_maker is None:
            raise RuntimeError(
                "Session maker not initialized. Call init_db() first."
            )
        return self._session_maker

    def init_db(self) -> None:
        """
        Initialize the database engine and session maker.

        This should be called during application startup.
        """
        logger.info("Initializing database connection pool...")
        self._engine = create_async_engine(
            str(self.config.url),
            echo=self.config.echo,
            pool_size=self.config.pool_size,
            max_overflow=self.config.max_overflow,
            pool_timeout=self.config.pool_timeout,
            pool_recycle=self.config.pool_recycle,
            pool_pre_ping=self.config.pool_pre_ping,
            # Additional PostgreSQL-specific settings
            connect_args={
                "server_settings": {
                    "application_name": "smart-interview-guideline",
                    "jit": "off",  # Disable JIT for better connection performance
                }
            },
        )

        self._session_maker = sessionmaker(
            bind=self._engine,
            class_=SQLModelAsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )
        logger.info(
            f"Database initialized: pool_size={self.config.pool_size}, "
            f"max_overflow={self.config.max_overflow}"
        )

    async def create_db_and_tables(self) -> None:
        """
        Create all database tables.

        This should be called during application startup after init_db().
        Note: In production, use Alembic for migrations instead.
        """
        logger.info("Creating database tables...")
        
        # Import all models here to ensure they're registered with SQLModel
        from app.models.example import ExampleModel  # noqa: F401
        from app.modules.account.models import User  # noqa: F401
        from app.modules.analysis.models import JDAnalysis  # noqa: F401
        from app.modules.company.models import Company  # noqa: F401
        from app.modules.contribution.models import Contribution  # noqa: F401
        from app.modules.questions.models import (  # noqa: F401
            AssessmentSession,
            UserQuestionAnswer,
        )
        from app.modules.preparation.models import Preparation  # noqa: F401
        from app.modules.roadmap.models import DailyTask, Roadmap  # noqa: F401
        
        async with self.engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
            await self._run_migrations(conn)
        logger.info("Database tables created successfully")

    async def _run_migrations(self, conn) -> None:
        """Add missing columns to existing tables (safe to run multiple times)."""
        from sqlalchemy import text
        # Add profile columns to users if missing (no bind params inside DO $$ - not supported by PostgreSQL)
        for col, col_type in [
            ("full_name", "VARCHAR(255)"),
            ("phone", "VARCHAR(50)"),
            ("linkedin_url", "VARCHAR(500)"),
            ("current_company", "VARCHAR(255)"),
            ("skills_summary", "TEXT"),
            ("education_summary", "TEXT"),
            ("preferred_language", "VARCHAR(10) DEFAULT 'en'"),
        ]:
            await conn.execute(text(f"""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'users' AND column_name = '{col}'
                    ) THEN
                        ALTER TABLE users ADD COLUMN {col} {col_type};
                    END IF;
                END $$;
            """))
        # Add preparation_id to assessment_sessions if missing
        await conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'assessment_sessions' AND column_name = 'preparation_id'
                ) THEN
                    ALTER TABLE assessment_sessions
                    ADD COLUMN preparation_id INTEGER REFERENCES preparations(id);
                END IF;
            END $$;
        """))
        # Add preparation_id to roadmaps if missing
        await conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'roadmaps' AND column_name = 'preparation_id'
                ) THEN
                    ALTER TABLE roadmaps
                    ADD COLUMN preparation_id INTEGER REFERENCES preparations(id);
                END IF;
            END $$;
        """))
        # Make user_question_answers.question_id nullable if needed (PostgreSQL: alter column drop not null)
        await conn.execute(text("""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'user_question_answers' AND column_name = 'question_id'
                ) THEN
                    ALTER TABLE user_question_answers ALTER COLUMN question_id DROP NOT NULL;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END $$;
        """))
        # Add moderation columns to contributions if missing
        await conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'contributions' AND column_name = 'status'
                ) THEN
                    ALTER TABLE contributions ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
                END IF;
            END $$;
        """))
        await conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'contributions' AND column_name = 'approved_by_admin_id'
                ) THEN
                    ALTER TABLE contributions ADD COLUMN approved_by_admin_id INTEGER REFERENCES users(id);
                END IF;
            END $$;
        """))
        await conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'contributions' AND column_name = 'approved_at'
                ) THEN
                    ALTER TABLE contributions ADD COLUMN approved_at TIMESTAMP;
                END IF;
            END $$;
        """))
        await conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'contributions' AND column_name = 'job_position'
                ) THEN
                    ALTER TABLE contributions ADD COLUMN job_position VARCHAR(255);
                END IF;
            END $$;
        """))
        # preparations.last_memory_scan_result (JSON) for viewing last scan result
        await conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'preparations' AND column_name = 'last_memory_scan_result'
                ) THEN
                    ALTER TABLE preparations ADD COLUMN last_memory_scan_result JSONB;
                END IF;
            END $$;
        """))

    async def close(self) -> None:
        """
        Close the database engine and cleanup resources.

        This should be called during application shutdown.
        """
        if self._engine:
            logger.info("Closing database connections...")
            await self._engine.dispose()
            self._engine = None
            self._session_maker = None
            logger.info("Database connections closed successfully")

    async def get_session(self) -> AsyncGenerator[SQLModelAsyncSession, None]:
        """
        Get an async database session.

        Yields:
            AsyncSession: Database session for executing queries

        Example:
            async with database.get_session() as session:
                result = await session.exec(select(User))
                users = result.all()
        """
        async with self._session_maker() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()


# Global database instance
database = Database()


async def get_db_session() -> AsyncGenerator[SQLModelAsyncSession, None]:
    """
    FastAPI dependency for getting a database session.

    Usage in FastAPI endpoints:
        @app.get("/users")
        async def get_users(session: AsyncSession = Depends(get_db_session)):
            result = await session.exec(select(User))
            return result.all()
    """
    async for session in database.get_session():
        yield session


# Type alias for dependency injection
DBSession = Annotated[SQLModelAsyncSession, Depends(get_db_session)]





# Utility functions for common database operations

async def execute_query(query, session: SQLModelAsyncSession):
    """
    Execute a query and return results.

    Args:
        query: SQLModel select query
        session: Database session

    Returns:
        Query results
    """
    result = await session.exec(query)
    return result.all()


async def get_by_id(model_class, id: int, session: SQLModelAsyncSession):
    """
    Get a model instance by ID.

    Args:
        model_class: SQLModel class
        id: Primary key value
        session: Database session

    Returns:
        Model instance or None
    """
    return await session.get(model_class, id)


async def create_instance(instance, session: SQLModelAsyncSession):
    """
    Create a new model instance.

    Args:
        instance: Model instance to create
        session: Database session

    Returns:
        Created instance with ID populated
    """
    session.add(instance)
    await session.commit()
    await session.refresh(instance)
    return instance


async def update_instance(instance, session: SQLModelAsyncSession):
    """
    Update an existing model instance.

    Args:
        instance: Model instance to update
        session: Database session

    Returns:
        Updated instance
    """
    session.add(instance)
    await session.commit()
    await session.refresh(instance)
    return instance


async def delete_instance(instance, session: SQLModelAsyncSession):
    """
    Delete a model instance.

    Args:
        instance: Model instance to delete
        session: Database session
    """
    await session.delete(instance)
    await session.commit()
