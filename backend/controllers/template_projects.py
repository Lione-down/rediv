from __future__ import annotations

from uuid import uuid4

from sqlalchemy import select

from controllers import canvas_document_mutations as mutation_controller
from controllers.template_graphs import (
    TemplateGraphForbiddenError,
    TemplateGraphNotFoundError,
    build_template_mutation,
    canonical_template_graph,
    template_to_dict,
)
from models.base import get_session, utc_now
from models.canvas import Canvas
from models.project import Project
from models.template import Template


def use_template_in_new_project(template_id: str, user_id: str) -> dict:
    with get_session() as session:
        template = session.scalar(
            select(Template).where(Template.id == template_id).with_for_update()
        )
        if template is None:
            raise TemplateGraphNotFoundError("Template not found")
        if template.user_id != user_id:
            raise TemplateGraphForbiddenError("Template does not belong to user")
        nodes, connections = canonical_template_graph(template, allow_empty=True)

        timestamp = utc_now()
        project = Project(
            id=str(uuid4()),
            user_id=user_id,
            name=template.name,
            canvas_order_revision=0,
            created_at=timestamp,
            updated_at=timestamp,
        )
        session.add(project)
        session.flush()
        canvas = Canvas(
            id=str(uuid4()),
            project_id=project.id,
            name="画布 1",
            sort_order=0,
            status="active",
            viewport_x=0,
            viewport_y=0,
            viewport_zoom=1,
            graph_revision=0,
            created_at=timestamp,
            updated_at=timestamp,
            deleted_at=None,
        )
        session.add(canvas)
        session.flush()

        if nodes or connections:
            mutation_payload, _, _ = build_template_mutation(
                template.id,
                canvas.id,
                nodes,
                connections,
                {
                    "base_revision": 0,
                    "client_mutation_id": f"template-use-{template.id}",
                    "anchor_x": None,
                    "anchor_y": None,
                },
            )
            mutation_controller.apply_document_patch_in_session(
                session,
                project.id,
                canvas.id,
                user_id,
                mutation_payload,
            )
        session.commit()
        return {
            "template": template_to_dict(template),
            "project_id": project.id,
            "project_name": project.name,
            "nodes_created": len(nodes),
        }
