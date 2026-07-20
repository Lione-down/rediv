from __future__ import annotations

from sqlalchemy import select

from models.base import get_session
from models.project import Project
from repositories.records import project_record


class ProjectRepository:
    def get(self, project_id: str) -> dict | None:
        with get_session() as session:
            row = session.get(Project, project_id)
            return project_record(row) if row is not None else None

    def list_for_user(self, user_id: str) -> list[dict]:
        with get_session() as session:
            rows = session.scalars(
                select(Project).where(Project.user_id == user_id).order_by(Project.created_at.desc())
            ).all()
            return [project_record(row) for row in rows]
