from __future__ import annotations

from sqlalchemy import select

from models.base import get_session
from models.workflow_template import (
    WorkflowTemplateDefinition,
    WorkflowTemplateInstance,
    WorkflowTemplateVersion,
)
from models.workflow_template_lineage import WorkflowTemplateInstanceStep
from schemas.story_production import StoryTemplateLineage


class WorkflowTemplateStoryLineageError(ValueError):
    pass


def resolve_workflow_template_story_lineage(
    *,
    lineage: StoryTemplateLineage,
    owner_user_id: str,
    project_id: str,
    canvas_id: str,
    script_node_id: str,
) -> StoryTemplateLineage:
    if lineage.script_node_id != script_node_id:
        raise WorkflowTemplateStoryLineageError("Template Script lineage is stale")
    with get_session() as session:
        match = session.execute(
            select(
                WorkflowTemplateInstance.id,
                WorkflowTemplateInstanceStep.id,
            )
            .join(
                WorkflowTemplateDefinition,
                WorkflowTemplateDefinition.id
                == WorkflowTemplateInstance.definition_id,
            )
            .join(
                WorkflowTemplateVersion,
                WorkflowTemplateVersion.id
                == WorkflowTemplateInstance.version_id,
            )
            .join(
                WorkflowTemplateInstanceStep,
                WorkflowTemplateInstanceStep.instance_id
                == WorkflowTemplateInstance.id,
            )
            .where(
                WorkflowTemplateInstance.id == lineage.instance_id,
                WorkflowTemplateInstance.owner_user_id == owner_user_id,
                WorkflowTemplateInstance.project_id == project_id,
                WorkflowTemplateInstance.canvas_id == canvas_id,
                WorkflowTemplateInstance.status.in_(
                    ("instantiated", "locally_modified", "upgrade_available")
                ),
                WorkflowTemplateDefinition.template_key == lineage.template_id,
                WorkflowTemplateVersion.version == lineage.template_version,
                WorkflowTemplateInstanceStep.id == lineage.instance_step_id,
                WorkflowTemplateInstanceStep.step_key == lineage.step_id,
                WorkflowTemplateInstanceStep.canvas_node_id == script_node_id,
            )
        ).first()
    if match is None:
        raise WorkflowTemplateStoryLineageError(
            "Template Script lineage is unavailable"
        )
    return lineage
