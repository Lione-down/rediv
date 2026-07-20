from __future__ import annotations

from models.base import get_session
from models.generation_task import GenerationTask
from repositories.records import generation_task_record


class GenerationTaskRepository:
    def get(self, task_id: str) -> dict | None:
        with get_session() as session:
            row = session.get(GenerationTask, task_id)
            return generation_task_record(row) if row is not None else None
