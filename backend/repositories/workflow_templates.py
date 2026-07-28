from __future__ import annotations

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from models.workflow_template import (
    WorkflowTemplateDefinition,
    WorkflowTemplateSlot,
    WorkflowTemplateVersion,
)


class WorkflowTemplateRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_definition(
        self,
        template_id: str,
        *,
        owner_user_id: str | None = None,
        lock: bool = False,
    ) -> WorkflowTemplateDefinition | None:
        statement = select(WorkflowTemplateDefinition).where(
            WorkflowTemplateDefinition.template_key == template_id
        )
        if owner_user_id is not None:
            statement = statement.where(
                WorkflowTemplateDefinition.scope == "private",
                WorkflowTemplateDefinition.owner_user_id == owner_user_id,
            )
        if lock:
            statement = statement.with_for_update()
        return self.session.scalar(statement)

    def get_version(
        self,
        definition_id: str,
        version: int,
    ) -> WorkflowTemplateVersion | None:
        return self.session.scalar(
            select(WorkflowTemplateVersion).where(
                WorkflowTemplateVersion.definition_id == definition_id,
                WorkflowTemplateVersion.version == version,
            )
        )

    def list_owner_latest(
        self,
        owner_user_id: str,
    ) -> list[tuple[WorkflowTemplateDefinition, WorkflowTemplateVersion]]:
        latest = (
            select(
                WorkflowTemplateVersion.definition_id,
                func.max(WorkflowTemplateVersion.version).label("latest_version"),
            )
            .group_by(WorkflowTemplateVersion.definition_id)
            .subquery()
        )
        statement = (
            select(WorkflowTemplateDefinition, WorkflowTemplateVersion)
            .join(
                latest,
                latest.c.definition_id == WorkflowTemplateDefinition.id,
            )
            .join(
                WorkflowTemplateVersion,
                (
                    WorkflowTemplateVersion.definition_id
                    == WorkflowTemplateDefinition.id
                )
                & (
                    WorkflowTemplateVersion.version
                    == latest.c.latest_version
                ),
            )
            .where(
                WorkflowTemplateDefinition.scope == "private",
                WorkflowTemplateDefinition.owner_user_id == owner_user_id,
            )
            .order_by(WorkflowTemplateDefinition.template_key)
        )
        return list(self.session.execute(statement).tuples().all())

    def max_version(self, definition_id: str) -> int:
        return (
            self.session.scalar(
                select(func.max(WorkflowTemplateVersion.version)).where(
                    WorkflowTemplateVersion.definition_id == definition_id
                )
            )
            or 0
        )

    def has_draft(self, definition_id: str) -> bool:
        return (
            self.session.scalar(
                select(WorkflowTemplateVersion.id)
                .where(
                    WorkflowTemplateVersion.definition_id == definition_id,
                    WorkflowTemplateVersion.lifecycle == "draft",
                )
                .limit(1)
            )
            is not None
        )

    def add_definition(
        self,
        definition: WorkflowTemplateDefinition,
    ) -> None:
        self.session.add(definition)
        self.session.flush()

    def add_version(self, version: WorkflowTemplateVersion) -> None:
        self.session.add(version)
        self.session.flush()

    def replace_slots(
        self,
        version_id: str,
        slots: list[WorkflowTemplateSlot],
    ) -> None:
        self.session.execute(
            delete(WorkflowTemplateSlot).where(
                WorkflowTemplateSlot.version_id == version_id
            )
        )
        self.session.add_all(slots)
        self.session.flush()
