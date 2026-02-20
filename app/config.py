from functools import lru_cache
from typing import Literal

from pydantic import Field, PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class DatabaseSettings(BaseSettings):

    # Database URL - supports both sync and async formats
    url: PostgresDsn = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/smart_interview",
        description="Database connection URL",
        validation_alias="DATABASE_URL",
    )

    # Connection pool settings
    pool_size: int = Field(
        default=5,
        ge=1,
        le=50,
        description="Number of connections to maintain in the pool",
        validation_alias="DB_POOL_SIZE",
    )

    max_overflow: int = Field(
        default=10,
        ge=0,
        le=100,
        description="Maximum number of connections to create beyond pool_size",
        validation_alias="DB_MAX_OVERFLOW",
    )

    pool_timeout: int = Field(
        default=30,
        ge=1,
        le=300,
        description="Timeout in seconds for getting a connection from the pool",
        validation_alias="DB_POOL_TIMEOUT",
    )

    pool_recycle: int = Field(
        default=3600,
        ge=300,
        description="Recycle connections after this many seconds",
        validation_alias="DB_POOL_RECYCLE",
    )

    pool_pre_ping: bool = Field(
        default=True,
        description="Enable connection health checks before using",
        validation_alias="DB_POOL_PRE_PING",
    )

    # Query settings
    echo: bool = Field(
        default=False,
        description="Echo SQL queries (useful for debugging)",
        validation_alias="DB_ECHO",
    )

    @field_validator("url", mode="before")
    @classmethod
    def convert_to_async_url(cls, v: str | PostgresDsn) -> str:
        """Convert sync PostgreSQL URL to async format."""
        url_str = str(v)
        if url_str.startswith("postgresql://"):
            url_str = url_str.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url_str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


class ServerSettings(BaseSettings):
    host: str = Field(
        default="0.0.0.0",
        description="Server host address",
        validation_alias="APP_HOST",
    )

    port: int = Field(
        default=8000,
        ge=1,
        le=65535,
        description="Server port",
        validation_alias="APP_PORT",
    )

    workers: int = Field(
        default=4,
        ge=1,
        le=32,
        description="Number of worker processes",
        validation_alias="WORKERS",
    )

    log_level: Literal["debug", "info", "warning", "error", "critical"] = Field(
        default="info",
        description="Logging level",
        validation_alias="LOG_LEVEL",
    )

    reload: bool = Field(
        default=False,
        description="Enable auto-reload on code changes (development only)",
        validation_alias="RELOAD",
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


class CORSSettings(BaseSettings):
    origins: list[str] = Field(
        default=["http://localhost:5173", "http://localhost:3000"],
        description="Allowed CORS origins",
        validation_alias="CORS_ORIGINS",
    )

    allow_credentials: bool = Field(
        default=True,
        description="Allow credentials in CORS requests",
        validation_alias="CORS_ALLOW_CREDENTIALS",
    )

    allow_methods: list[str] = Field(
        default=["*"],
        description="Allowed HTTP methods",
        validation_alias="CORS_ALLOW_METHODS",
    )

    allow_headers: list[str] = Field(
        default=["*"],
        description="Allowed headers",
        validation_alias="CORS_ALLOW_HEADERS",
    )

    @field_validator("origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | list[str]) -> list[str]:
        """Parse CORS origins from comma-separated string or list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


class OpenAISettings(BaseSettings):
    api_key: str = Field(
        default="",
        description="OpenAI API key",
        validation_alias="OPENAI_API_KEY",
    )

    model: str = Field(
        default="gpt-4",
        description="Default OpenAI model",
        validation_alias="OPENAI_MODEL",
    )

    temperature: float = Field(
        default=0.7,
        ge=0.0,
        le=2.0,
        description="Model temperature for randomness",
        validation_alias="OPENAI_TEMPERATURE",
    )

    max_tokens: int = Field(
        default=2000,
        ge=1,
        le=128000,
        description="Maximum tokens in response",
        validation_alias="OPENAI_MAX_TOKENS",
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


class StorageSettings(BaseSettings):
    """Settings for file upload storage."""

    upload_dir: str = Field(
        default="./uploads",
        description="Root directory for file uploads",
        validation_alias="UPLOAD_DIR",
    )

    cv_subdir: str = Field(
        default="cv",
        description="Subdirectory under upload_dir for CV files",
        validation_alias="UPLOAD_CV_SUBDIR",
    )

    max_cv_size_mb: int = Field(
        default=10,
        ge=1,
        le=50,
        description="Maximum CV file size in megabytes",
        validation_alias="MAX_CV_SIZE_MB",
    )

    allowed_cv_extensions: list[str] = Field(
        default=[".pdf", ".docx", ".txt"],
        description="Allowed file extensions for CV uploads",
    )

    jd_subdir: str = Field(
        default="jd",
        description="Subdirectory under upload_dir for JD (job description) files",
        validation_alias="UPLOAD_JD_SUBDIR",
    )

    @property
    def cv_upload_path(self) -> str:
        """Get the full path for CV uploads."""
        import os
        return os.path.join(self.upload_dir, self.cv_subdir)

    @property
    def max_cv_size_bytes(self) -> int:
        """Get the maximum CV file size in bytes."""
        return self.max_cv_size_mb * 1024 * 1024

    @property
    def jd_upload_path(self) -> str:
        """Get the full path for JD (job description) file uploads."""
        import os
        return os.path.join(self.upload_dir, self.jd_subdir)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


class AuthSettings(BaseSettings):
    jwt_secret_key: str = Field(
        default="your-secret-key-change-in-production-please",
        description="Secret key for JWT token signing",
        validation_alias="JWT_SECRET_KEY",
    )

    jwt_algorithm: str = Field(
        default="HS256",
        description="Algorithm for JWT token signing",
        validation_alias="JWT_ALGORITHM",
    )

    access_token_expire_minutes: int = Field(
        default=30,
        ge=1,
        le=10080,  # 1 week max
        description="Access token expiration time in minutes",
        validation_alias="ACCESS_TOKEN_EXPIRE_MINUTES",
    )

    refresh_token_expire_days: int = Field(
        default=7,
        ge=1,
        le=365,
        description="Refresh token expiration time in days",
        validation_alias="REFRESH_TOKEN_EXPIRE_DAYS",
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


class Settings(BaseSettings):
    app_name: str = Field(
        default="Smart Interview Guideline",
        description="Application name",
        validation_alias="APP_NAME",
    )

    version: str = Field(
        default="0.1.0",
        description="Application version",
        validation_alias="APP_VERSION",
    )

    environment: Literal["development", "staging", "production"] = Field(
        default="development",
        description="Application environment",
        validation_alias="APP_ENV",
    )

    debug: bool = Field(
        default=False,
        description="Enable debug mode",
        validation_alias="DEBUG",
    )

    # Nested settings
    database: DatabaseSettings = Field(default_factory=DatabaseSettings)
    server: ServerSettings = Field(default_factory=ServerSettings)
    cors: CORSSettings = Field(default_factory=CORSSettings)
    openai: OpenAISettings = Field(default_factory=OpenAISettings)
    auth: AuthSettings = Field(default_factory=AuthSettings)
    storage: StorageSettings = Field(default_factory=StorageSettings)

    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment == "production"

    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.environment == "development"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_nested_delimiter="__",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """
    Get cached application settings.

    This function uses lru_cache to ensure settings are loaded only once
    and reused across the application.

    Returns:
        Settings: Application settings instance

    Example:
        from app.config import get_settings

        settings = get_settings()
        print(settings.database.url)
        print(settings.server.port)
    """
    return Settings()


# Convenience exports
settings = get_settings()

__all__ = [
    "Settings",
    "DatabaseSettings",
    "ServerSettings",
    "CORSSettings",
    "OpenAISettings",
    "AuthSettings",
    "StorageSettings",
    "get_settings",
    "settings",
]
