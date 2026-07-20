"""Request-scoped persistence repositories."""

from repositories.assets import AssetRepository
from repositories.canvas_graph import CanvasGraphRepository
from repositories.generation_tasks import GenerationTaskRepository
from repositories.projects import ProjectRepository
from repositories.protocols import FreshQuotaView
from repositories.users import UserRepository

__all__ = [
    "AssetRepository",
    "CanvasGraphRepository",
    "GenerationTaskRepository",
    "ProjectRepository",
    "FreshQuotaView",
    "UserRepository",
]
