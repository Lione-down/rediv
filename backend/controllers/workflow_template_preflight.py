from __future__ import annotations

from pydantic import ValidationError
from sqlalchemy import select

from controllers.workflow_templates import (
    WorkflowTemplateConflictError,
    WorkflowTemplateLifecycleError,
    WorkflowTemplateNotFoundError,
    get_workflow_template,
)
from core.generation_parameter_contract import build_generation_capabilities
from models.asset import Asset
from models.base import get_session
from models.canvas import Canvas
from models.canvas_connection import CanvasConnection
from models.canvas_node import CanvasNode
from models.project import Project
from models.quota import Quota
from schemas.workflow_template import WorkflowTemplateManifest
from services.workflow_templates.portable_classifier import (
    PortableCaptureError,
    build_portable_capture,
)
from services.workflow_templates.preflight import run_provider_free_preflight


def capture_workflow_template(
    project_id: str,
    canvas_id: str,
    owner_user_id: str,
    request,
) -> dict:
    try:
        with get_session() as session:
            project = session.scalar(select(Project).where(Project.id == project_id))
            if project is None or project.user_id != owner_user_id:
                raise WorkflowTemplateNotFoundError("Project not found")
            canvas = session.scalar(
                select(Canvas).where(
                    Canvas.id == canvas_id,
                    Canvas.project_id == project_id,
                    Canvas.status == "active",
                )
            )
            if canvas is None:
                raise WorkflowTemplateNotFoundError("Canvas not found")
            nodes = list(
                session.scalars(
                    select(CanvasNode)
                    .where(
                        CanvasNode.project_id == project_id,
                        CanvasNode.canvas_id == canvas_id,
                        CanvasNode.status != "deleted",
                    )
                    .order_by(CanvasNode.z_index, CanvasNode.created_at, CanvasNode.id)
                ).all()
            )
            connections = list(
                session.scalars(
                    select(CanvasConnection)
                    .where(
                        CanvasConnection.project_id == project_id,
                        CanvasConnection.canvas_id == canvas_id,
                        CanvasConnection.status != "deleted",
                    )
                    .order_by(CanvasConnection.created_at, CanvasConnection.id)
                ).all()
            )
            assets = list(
                session.scalars(
                    select(Asset).where(
                        Asset.user_id == owner_user_id,
                        Asset.project_id == project_id,
                    )
                ).all()
            )
            return build_portable_capture(
                nodes=nodes,
                connections=connections,
                assets_by_id={asset.id: asset for asset in assets},
                owner_user_id=owner_user_id,
                project_id=project_id,
                request=request,
            )
    except (PortableCaptureError, ValidationError) as error:
        code = (
            error.code
            if isinstance(error, PortableCaptureError)
            else "workflow_template_capture_invalid"
        )
        raise WorkflowTemplateLifecycleError(
            "Workflow-template capture is invalid",
            code=code,
        ) from error


def preflight_workflow_template(
    template_id: str,
    version_number: int,
    owner_user_id: str,
    request,
) -> dict:
    exact = get_workflow_template(template_id, version_number, owner_user_id)
    if exact["lifecycle"] == "retired":
        raise WorkflowTemplateConflictError(
            "Workflow-template version is unavailable for preflight",
            code="workflow_template_version_unavailable",
        )
    try:
        manifest = WorkflowTemplateManifest.model_validate(exact["manifest"])
    except ValidationError as error:
        raise WorkflowTemplateLifecycleError(
            "Workflow-template schema or version is invalid",
            code="workflow_template_schema_invalid",
        ) from error

    with get_session() as session:
        project = session.scalar(select(Project).where(Project.id == request.project_id))
        if project is None or project.user_id != owner_user_id:
            raise WorkflowTemplateNotFoundError("Project not found")
        canvas = session.scalar(
            select(Canvas).where(
                Canvas.id == request.canvas_id,
                Canvas.project_id == request.project_id,
                Canvas.status == "active",
            )
        )
        if canvas is None:
            raise WorkflowTemplateNotFoundError("Canvas not found")
        requested_asset_ids = {
            binding.asset_id
            for bindings in request.asset_bindings.values()
            for binding in bindings
        }
        assets = (
            list(
                session.scalars(
                    select(Asset).where(Asset.id.in_(requested_asset_ids))
                ).all()
            )
            if requested_asset_ids
            else []
        )
        quota = session.scalar(select(Quota).where(Quota.user_id == owner_user_id))
        quota_balances = (
            {
                "text": quota.text_quota,
                "image": quota.image_quota,
                "video": quota.video_quota,
            }
            if quota is not None
            else {"text": 0, "image": 0, "video": 0}
        )
        return run_provider_free_preflight(
            manifest=manifest,
            owner_user_id=owner_user_id,
            project_id=request.project_id,
            canvas_id=request.canvas_id,
            variable_bindings=request.variable_bindings,
            asset_bindings=request.asset_bindings,
            assets_by_id={asset.id: asset for asset in assets},
            capabilities=build_generation_capabilities(),
            quota_balances=quota_balances,
            cost_confirmed=request.cost_confirmed,
        )
