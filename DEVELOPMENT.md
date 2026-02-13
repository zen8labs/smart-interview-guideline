# Development Guide

This guide explains how to run the application in development mode with hot reload for both frontend and backend.

## Project Structure

All Dockerfiles are organized in the `dockerfiles/` directory:

- `dockerfiles/Dockerfile` - Production build (multi-stage)
- `dockerfiles/dev.Dockerfile` - Backend development with hot reload
- `dockerfiles/dev-frontend.Dockerfile` - Frontend development with HMR

## Prerequisites

- Docker Desktop 4.24+ (includes Docker Compose 2.22.0+)
- Git

## Development Setup

### 1. Clone and Setup Environment

```bash
# Clone the repository
git clone <repository-url>
cd smart-interview-guideline

# Copy environment file
cp .env.example .env

# Edit .env if needed (optional)
```

### 2. Start Development Environment

The project uses `docker-compose.override.yaml` which automatically applies when running `docker compose` commands.

```bash
# Start all services in development mode
docker compose up -d

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f app
docker compose logs -f frontend
docker compose logs -f postgres
```

### 3. Development with Watch Mode (Recommended)

Docker Compose watch mode provides automatic syncing and rebuilding:

```bash
# Start with watch mode for hot reload
docker compose watch

# This will:
# - Sync code changes to containers automatically
# - Trigger rebuilds when dependencies change
# - Enable HMR for frontend (Vite)
# - Enable hot reload for backend (uvicorn --reload)
```

## Services

### Frontend (React + Vite)

- **URL**: http://localhost:5173
- **Hot Module Replacement**: Enabled
- **Source**: `./web` directory
- **Auto-reload**: Yes (via Vite HMR)

### Backend (FastAPI + Uvicorn)

- **URL**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Source**: `./app` directory
- **Auto-reload**: Yes (via uvicorn --reload)

### PostgreSQL

- **Host**: localhost
- **Port**: 5432 (configurable via POSTGRES_PORT)
- **Database**: smart_interview (configurable)
- **User**: postgres (configurable)
- **Password**: postgres (configurable)

## Development Workflow

### Making Code Changes

#### Frontend Changes

1. Edit files in `./web/src`
2. Changes are automatically synced to the container
3. Vite HMR updates the browser instantly
4. No rebuild needed

#### Backend Changes

1. Edit files in `./app`
2. Changes are automatically synced to the container
3. Uvicorn detects changes and reloads
4. No rebuild needed

#### Dependency Changes

**Frontend** (`package.json` or `yarn.lock`):

```bash
# Stop the services
docker compose down

# Rebuild frontend service
docker compose build frontend

# Start again
docker compose up -d
```

**Backend** (`pyproject.toml`):

```bash
# Stop the services
docker compose down

# Rebuild app service
docker compose build app

# Start again
docker compose up -d
```

## Useful Commands

### Container Management

```bash
# Stop all services
docker compose down

# Stop and remove volumes (⚠️ deletes database data)
docker compose down -v

# Rebuild specific service
docker compose build app
docker compose build frontend

# Restart specific service
docker compose restart app
docker compose restart frontend

# View running containers
docker compose ps
```

### Database Management

```bash
# Access PostgreSQL shell
docker compose exec postgres psql -U postgres -d smart_interview

# Backup database
docker compose exec postgres pg_dump -U postgres smart_interview > backup.sql

# Restore database
docker compose exec -T postgres psql -U postgres smart_interview < backup.sql
```

### Debugging

```bash
# Execute commands in running container
docker compose exec app bash
docker compose exec frontend sh

# View container logs with timestamps
docker compose logs -f --timestamps app

# Follow logs from all services
docker compose logs -f
```

## Production Build

To test the production build locally:

```bash
# Remove override file temporarily
mv docker-compose.override.yaml docker-compose.override.yaml.bak

# Build and run production setup
docker compose up -d --build

# Restore override file
mv docker-compose.override.yaml.bak docker-compose.override.yaml
```

## Troubleshooting

### Frontend HMR not working

- Ensure `vite.config.ts` has `server.watch.usePolling: true`
- Check that port 5173 is not in use
- Verify volume mounts in `docker-compose.override.yaml`

### Backend not reloading

- Check that `--reload` flag is present in the command
- Verify volume mounts exclude `.venv` directory
- Check logs: `docker compose logs app`

### Database connection issues

- Ensure PostgreSQL is healthy: `docker compose ps`
- Check DATABASE_URL in environment variables
- Wait for PostgreSQL to be ready (health check)

### Port conflicts

- Change ports in `.env` file
- Restart services: `docker compose down && docker compose up -d`

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Development Setup                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │   Frontend   │      │   Backend    │      │ PostgreSQL│ │
│  │              │      │              │      │           │ │
│  │  Vite HMR    │─────▶│  Uvicorn     │─────▶│  Port     │ │
│  │  Port 5173   │      │  Port 8000   │      │  5432     │ │
│  │              │      │  --reload    │      │           │ │
│  └──────────────┘      └──────────────┘      └───────────┘ │
│         │                     │                     │        │
│         │                     │                     │        │
│  ┌──────▼─────────────────────▼─────────────────────▼─────┐ │
│  │           app_network (isolated bridge)                │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  Volume Mounts (Hot Reload):                                 │
│  • ./web → /app (frontend source)                           │
│  • ./app → /app/app (backend source)                        │
│  • postgres_data (persistent database)                      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:

- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`: Database credentials
- `APP_PORT`: Backend port (default: 8000)
- `FRONTEND_PORT`: Frontend port (default: 5173)
- `LOG_LEVEL`: Logging level (debug, info, warning, error)
- `WORKERS`: Number of Gunicorn workers (production only)
