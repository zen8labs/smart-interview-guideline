import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlmodel import select

from app.config import settings
from app.models.example import ExampleModel
from app.modules.account import profile_router, router as account_router
from app.modules.admin import router as admin_router
from app.modules.questions import router as questions_router
from app.utils.db import DBSession, database

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for FastAPI application.
    
    Handles:
    - Database initialization on startup
    - Database cleanup on shutdown
    """
    # Startup: Initialize database connection pool and create tables
    try:
        logger.info("Starting application...")
        database.init_db()
        await database.create_db_and_tables()

        # Ensure upload directories exist
        from pathlib import Path
        cv_upload_path = Path(settings.storage.cv_upload_path)
        cv_upload_path.mkdir(parents=True, exist_ok=True)
        logger.info(f"Upload directory ready: {cv_upload_path}")

        logger.info("Application startup complete")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise
    
    yield
    
    # Shutdown: Close database connections and cleanup resources
    try:
        logger.info("Shutting down application...")
        await database.close()
        logger.info("Application shutdown complete")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")


def create_app():
    app = FastAPI(
        title="Smart Interview Guideline API",
        description="API for smart interview guideline system",
        version="0.1.0",
        lifespan=lifespan,
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors.origins,
        allow_credentials=settings.cors.allow_credentials,
        allow_methods=settings.cors.allow_methods,
        allow_headers=settings.cors.allow_headers,
    )

    # Include routers
    app.include_router(account_router)
    app.include_router(profile_router)
    app.include_router(admin_router)
    app.include_router(questions_router)

    @app.get("/health")
    def health():
        """Health check endpoint."""
        return {"status": "ok"}

    # Example database endpoints
    @app.get("/api/examples")
    async def list_examples(session: DBSession):
        """List all examples from the database."""
        result = await session.exec(select(ExampleModel))
        examples = result.all()
        return {"examples": examples}

    @app.post("/api/examples")
    async def create_example(example: ExampleModel, session: DBSession):
        """Create a new example in the database."""
        session.add(example)
        await session.commit()
        await session.refresh(example)
        return example

    @app.get("/api/examples/{example_id}")
    async def get_example(example_id: int, session: DBSession):
        """Get a specific example by ID."""
        example = await session.get(ExampleModel, example_id)
        if not example:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Example not found")
        return example

    # Mount static files last (catches all routes)
    app.mount("/", StaticFiles(directory="./web/dist", html=True), name="static")

    return app