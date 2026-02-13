# Stage 1: Frontend Builder
FROM node:22-alpine AS frontend-builder

WORKDIR /app/web

# Copy package files
COPY web/package.json web/yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy frontend source code
COPY web/ ./

# Build frontend
RUN yarn build

# Stage 2: Python Builder with uv
FROM ghcr.io/astral-sh/uv:python3.14-bookworm-slim AS python-builder

# Set working directory
WORKDIR /app

# Enable bytecode compilation for faster startup
ENV UV_COMPILE_BYTECODE=1

# Copy from the cache instead of linking since it's a multi-stage build
ENV UV_LINK_MODE=copy

# Install dependencies first (better layer caching)
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --no-install-project --no-dev

# Copy application code
COPY app/ ./app/
COPY asgi.py gunicorn.config.py pyproject.toml ./

# Install the project
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --no-dev

# Stage 3: Final Runtime Image
FROM python:3.14-slim-bookworm

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/app/.venv/bin:$PATH"

# Create non-root user
RUN groupadd --system --gid 999 appuser && \
    useradd --system --gid 999 --uid 999 --create-home appuser

# Copy the virtual environment from the builder
COPY --from=python-builder --chown=appuser:appuser /app/.venv /app/.venv

# Copy application code
COPY --from=python-builder --chown=appuser:appuser /app/app /app/app
COPY --from=python-builder --chown=appuser:appuser /app/asgi.py /app/gunicorn.config.py ./

# Copy built frontend from frontend-builder stage
COPY --from=frontend-builder --chown=appuser:appuser /app/web/dist ./web/dist

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

# Run the application
CMD ["gunicorn", "-c", "gunicorn.config.py", "asgi:app"]
