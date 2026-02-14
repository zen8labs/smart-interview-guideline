# AGENTS.md

## Project Overview

Smart Interview Guideline is a full-stack web application for managing interview processes with AI assistance. The application uses:

- **Backend**: FastAPI (Python 3.11+) with async support, SQLModel ORM, PostgreSQL database
- **Frontend**: React 19 with TypeScript, Vite, Redux Toolkit for state management
- **Infrastructure**: Docker Compose for containerized development and production environments
- **AI Integration**: OpenAI API for intelligent interview assistance

### Architecture

```
smart-interview-guideline/
├── app/                    # Backend (FastAPI)
│   ├── modules/           # Feature modules (account, login, etc.)
│   │   └── <module>/
│   │       ├── __init__.py
│   │       ├── models.py  # SQLModel database models
│   │       ├── views.py   # FastAPI route handlers
│   │       └── urls.py    # Route registration
│   ├── utils/             # Shared utilities (db, helpers)
│   ├── app.py             # FastAPI application factory
│   └── config.py          # Pydantic settings management
├── web/                   # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── store/        # Redux Toolkit store and API slices
│   │   ├── providers/    # React context providers
│   │   └── assets/       # Static assets
│   └── dist/             # Production build output
├── dockerfiles/          # Docker configurations
│   ├── Dockerfile        # Production multi-stage build
│   ├── dev.Dockerfile    # Backend development with hot reload
│   └── dev-frontend.Dockerfile  # Frontend development with HMR
└── docker-compose.yaml   # Production services
    docker-compose.override.yaml  # Development overrides
```

## Setup Commands

### Development Environment

```bash
# Prerequisites: Docker Desktop 4.24+

# 1. Clone and setup environment
cp .env.example .env
# Edit .env if needed (database credentials, OpenAI API key, etc.)

# 2. Start all services with hot reload
docker compose up -d

# 3. Start with watch mode (recommended for active development)
docker compose watch

# 4. View logs
docker compose logs -f          # All services
docker compose logs -f app      # Backend only
docker compose logs -f frontend # Frontend only
```

## Code Style and Conventions

### Python (Backend)

#### General Principles

- **Python Version**: 3.11+
- **Type Hints**: Always use type hints for function parameters and return values
- **Async/Await**: Use async functions for all I/O operations (database, HTTP requests)
- **Imports**: Group imports in order: standard library, third-party, local modules

#### Code Style

- **Formatter**: Follow PEP 8 conventions
- **Line Length**: Maximum 100 characters
- **Quotes**: Use double quotes for strings
- **Naming**:
  - Functions/variables: `snake_case`
  - Classes: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Private members: prefix with `_`

#### Module Structure Pattern

Each feature module follows this structure:

```python
# modules/<feature>/__init__.py
from .urls import router

# modules/<feature>/models.py
from sqlmodel import SQLModel, Field

class ExampleModel(SQLModel, table=True):
    """Database model with clear docstring."""
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(max_length=255, index=True)

# modules/<feature>/views.py
from fastapi import APIRouter, HTTPException
from app.utils.db import DBSession

router = APIRouter(prefix="/api/examples", tags=["examples"])

@router.get("/")
async def list_examples(session: DBSession):
    """List all examples with clear docstring."""
    # Implementation
    pass

# modules/<feature>/urls.py
from .views import router
```

#### Database Patterns

- **Session Management**: Use `DBSession` dependency injection (from `app.utils.db`)
- **Connection Pooling**: Configured in `config.py` (pool_size, max_overflow, etc.)
- **Async Operations**: Always use `await` with database operations
- **Models**: Use SQLModel for ORM (combines Pydantic and SQLAlchemy)

```python
# Correct pattern
async def get_item(item_id: int, session: DBSession):
    item = await session.get(ItemModel, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item
```

#### Configuration Management

- **Settings**: Use Pydantic Settings from `app.config`
- **Environment Variables**: Define in `.env` file, never commit secrets
- **Nested Config**: Use double underscore delimiter (e.g., `DATABASE__POOL_SIZE`)

```python
from app.config import settings

# Access nested settings
db_url = settings.database.url
api_key = settings.openai.api_key
```

#### Error Handling

- Use FastAPI's `HTTPException` for API errors
- Log errors with appropriate levels (logger.error, logger.warning)
- Provide clear error messages in responses

### TypeScript (Frontend)

#### General Principles

- **TypeScript**: Strict mode enabled
- **React**: Functional components with hooks
- **State Management**: Redux Toolkit with RTK Query for API calls

#### Code Style

- **Quotes**: Single quotes for strings
- **Semicolons**: No semicolons
- **Naming**:
  - Components: `PascalCase`
  - Functions/variables: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Types/Interfaces: `PascalCase`

#### Component Patterns

```typescript
// Functional component with TypeScript
interface ExampleProps {
  title: string
  onAction?: () => void
}

export function Example({ title, onAction }: ExampleProps) {
  // Use hooks at the top
  const [state, setState] = useState<string>('')

  // Event handlers
  const handleClick = () => {
    onAction?.()
  }

  return (
    <div>
      <h1>{title}</h1>
    </div>
  )
}
```

#### Redux Toolkit Patterns

- **Store Structure**: Organized in `src/store/`
- **API Slices**: Use RTK Query for backend communication
- **Endpoints**: Define in `src/store/api/endpoints/`

```typescript
// API slice pattern
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const exampleApi = createApi({
  reducerPath: "exampleApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  endpoints: (builder) => ({
    getExamples: builder.query<Example[], void>({
      query: () => "/examples",
    }),
  }),
});

export const { useGetExamplesQuery } = exampleApi;
```

#### Import Organization

```typescript
// 1. React and external libraries
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";

// 2. Internal modules
import { useGetExamplesQuery } from "@/store/api/endpoints/exampleApi";
import { Example } from "@/components/Example";

// 3. Styles
import "./App.css";
```

## Development Workflow

- **Frontend changes**: Edit `./web/src` → Vite HMR auto-updates
- **Backend changes**: Edit `./app` → Uvicorn auto-reloads
- **Dependency changes**: Rebuild service with `docker compose build <service>`
- **New backend module**: Create `app/modules/<feature>/` with `models.py`, `views.py`, `urls.py`
- **New frontend component**: Add to `src/components/` with TypeScript interfaces
- **Database migrations**: Tables auto-created on startup (use Alembic for production)

## Environment Variables

Required: `DATABASE_URL`, `OPENAI_API_KEY`

See `.env.example` for all options (database pooling, server config, CORS, OpenAI parameters).

## Security

- Never commit `.env` or secrets
- Use connection pooling and `pool_pre_ping` for database health
- Validate inputs with Pydantic, restrict CORS origins
- Use multi-stage Docker builds, scan images regularly

## Service URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Production: Backend serves frontend from port 8000

## Common Tasks

```bash
# Debug
docker compose logs -f app
docker compose exec app bash

# Clean restart
docker compose down -v
docker compose build --no-cache && docker compose up -d
```

## Notes for AI Agents

- Check existing patterns before implementing new features
- Maintain code style consistency (see sections above)
- Test changes in development environment first
- Add error handling and logging
- See `DEVELOPMENT.md` for detailed workflow
