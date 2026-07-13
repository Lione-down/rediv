from __future__ import annotations

import sys
from typing import Protocol


class GenerationProvider(Protocol):
    async def chat(self, **kwargs) -> dict: ...

    async def generate_image(self, **kwargs) -> dict: ...

    async def generate_video(self, **kwargs) -> dict: ...

    async def poll_video_result(self, video_id: str) -> dict: ...


def get_generation_provider() -> GenerationProvider:
    # `main` imports `api.router`, so importing it here would create a circular import.
    main_module = sys.modules.get("main") or sys.modules.get("backend.main")
    if main_module is None or not hasattr(main_module, "get_agnes"):
        raise RuntimeError("Agnes provider is unavailable")
    return main_module.get_agnes()
