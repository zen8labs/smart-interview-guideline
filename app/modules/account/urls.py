"""URL routing configuration for account module."""

from .profile_views import profile_router
from .views import router

__all__ = ["router", "profile_router"]
