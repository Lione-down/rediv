from __future__ import annotations

from dataclasses import dataclass

from core.agnes_contract import build_image_request
from core.agnes_image_reference import resolve_agnes_public_image_url
from core.generation_parameter_contract import (
    IMAGE_MODEL,
    VIDEO_MODEL,
    normalize_image_parameters,
    normalize_video_parameters,
)
from models.asset import Asset
from models.canvas_node import CanvasNode
from models.workflow_template_lineage import WorkflowTemplateInstanceStep
from schemas.story_production import StoryProductionDocument
from services.workflow_templates.provider_projection import (
    compile_workflow_template_video_projection,
)


IMAGE_PRECOMPOSITION_MODEL = "agnes-image-2.0-flash"


class WorkflowRunStepCompilationError(ValueError):
    pass


@dataclass(frozen=True)
class WorkflowRunStepPlan:
    intent: str
    media_type: str | None
    model_id: str | None
    prompt: str | None
    provider_request: dict | None
    is_satisfied: bool


def _content(node: CanvasNode) -> dict:
    if not isinstance(node.content, dict):
        raise WorkflowRunStepCompilationError("Workflow step card content is invalid")
    return node.content


def _prompt(content: dict) -> str:
    candidate = content.get("text")
    if not isinstance(candidate, str) or not candidate.strip():
        candidate = content.get("prompt")
    if not isinstance(candidate, str) or not candidate.strip():
        raise WorkflowRunStepCompilationError("Workflow step prompt is required")
    normalized = candidate.strip()
    if len(normalized) > 16_000:
        raise WorkflowRunStepCompilationError("Workflow step prompt is too long")
    return normalized


def _parameters(content: dict, media_type: str) -> dict:
    parameters = content.get("generation_parameters")
    if parameters is None:
        return {}
    if (
        not isinstance(parameters, dict)
        or parameters.get("schema_version") != 1
        or not isinstance(parameters.get(media_type), dict)
    ):
        raise WorkflowRunStepCompilationError(
            f"Workflow {media_type} parameters are invalid"
        )
    return parameters[media_type]


def _ordered_assets(
    step: WorkflowTemplateInstanceStep,
    assets_by_slot: dict[str, list[Asset]],
    dependency_assets: list[Asset],
) -> list[Asset]:
    ordered: list[Asset] = []
    seen: set[str] = set()
    for slot_id in step.configuration.get("input_bindings", []):
        for asset in assets_by_slot.get(slot_id, []):
            if asset.id not in seen:
                seen.add(asset.id)
                ordered.append(asset)
    for asset in dependency_assets:
        if asset.id not in seen:
            seen.add(asset.id)
            ordered.append(asset)
    return ordered


def _image_plan(
    *,
    intent: str,
    content: dict,
    prompt: str,
    assets: list[Asset],
) -> WorkflowRunStepPlan:
    parameters = _parameters(content, "image")
    output_count = parameters.get("output_count", 1)
    if output_count != 1:
        raise WorkflowRunStepCompilationError(
            "Durable workflow steps require one owning-card image output"
        )
    image_urls = [resolve_agnes_public_image_url(asset.url or "") for asset in assets]
    normalized = normalize_image_parameters(
        aspect_ratio=parameters.get("aspect_ratio"),
        image_ids=[asset.id for asset in assets],
        size=parameters.get("size"),
        output_count=output_count,
        shot_controls=parameters.get("shot_controls"),
    )
    model_id = (
        IMAGE_PRECOMPOSITION_MODEL
        if intent == "image-precomposition"
        else IMAGE_MODEL
    )
    if intent == "image-precomposition":
        if not 2 <= len(image_urls) <= 9:
            raise WorkflowRunStepCompilationError(
                "Image precomposition requires two to nine references"
            )
        request = {
            "model": model_id,
            "prompt": prompt,
            "extra_body": {
                "image": image_urls,
                "response_format": "url",
            },
        }
    else:
        request = build_image_request(
            model=model_id,
            prompt=prompt,
            size=normalized.provider_size,
            ratio=normalized.provider_ratio,
            images=image_urls,
            response_format="url",
        )
    return WorkflowRunStepPlan(
        intent=intent,
        media_type="image",
        model_id=model_id,
        prompt=prompt,
        provider_request={
            "contract_id": (
                "agnes.image-2.0.generations.v1"
                if intent == "image-precomposition"
                else "agnes.image-2.1.generations.v1"
            ),
            "request": request,
        },
        is_satisfied=False,
    )


def _video_plan(
    *,
    content: dict,
    prompt: str,
    assets: list[Asset],
) -> WorkflowRunStepPlan:
    parameters = _parameters(content, "video")
    raw_bindings = parameters.get("reference_bindings")
    assets_by_id = {asset.id: asset for asset in assets}
    video_references = None
    if raw_bindings is not None:
        if not isinstance(raw_bindings, list):
            raise WorkflowRunStepCompilationError(
                "Workflow video reference bindings are invalid"
            )
        video_references = raw_bindings
        ordered_assets: list[Asset] = []
        for binding in raw_bindings:
            if not isinstance(binding, dict):
                raise WorkflowRunStepCompilationError(
                    "Workflow video reference binding is invalid"
                )
            asset = assets_by_id.get(binding.get("asset_id"))
            if asset is None:
                raise WorkflowRunStepCompilationError(
                    "Workflow video reference asset is unavailable"
                )
            ordered_assets.append(asset)
        assets = ordered_assets
    elif len(assets) > 1:
        raise WorkflowRunStepCompilationError(
            "Multiple workflow video images require explicit temporal bindings"
        )
    image_urls = [resolve_agnes_public_image_url(asset.url or "") for asset in assets]
    normalized = normalize_video_parameters(
        reference_mode=parameters.get("reference_mode"),
        duration_seconds=parameters.get("duration_seconds"),
        image_ids=None if video_references is not None else [asset.id for asset in assets],
        aspect_ratio=parameters.get("aspect_ratio"),
        resolution=parameters.get("resolution"),
        video_references=video_references,
        negative_prompt=parameters.get("negative_prompt"),
        shot_controls=parameters.get("shot_controls"),
    )
    projection = compile_workflow_template_video_projection(
        prompt=prompt,
        normalized_parameters=normalized,
        image_urls=image_urls,
    )
    return WorkflowRunStepPlan(
        intent="shot-video",
        media_type="video",
        model_id=VIDEO_MODEL,
        prompt=prompt,
        provider_request={
            "contract_id": projection.contract_id,
            "request": projection.request,
        },
        is_satisfied=False,
    )


def compile_workflow_run_step(
    *,
    step: WorkflowTemplateInstanceStep,
    node: CanvasNode,
    assets_by_slot: dict[str, list[Asset]],
    dependency_assets: list[Asset] | None = None,
) -> WorkflowRunStepPlan:
    content = _content(node)
    configuration = step.configuration
    intent = configuration.get("intent")
    if intent == "story-production":
        story = content.get("story_production")
        if not isinstance(story, dict):
            raise WorkflowRunStepCompilationError(
                "Workflow Script must contain confirmed Story Production"
            )
        StoryProductionDocument.model_validate(story)
        return WorkflowRunStepPlan(
            intent=intent,
            media_type=None,
            model_id=None,
            prompt=None,
            provider_request=None,
            is_satisfied=True,
        )
    prompt = _prompt(content)
    assets = _ordered_assets(step, assets_by_slot, dependency_assets or [])
    if intent in {"shot-image", "image-precomposition"}:
        return _image_plan(
            intent=intent,
            content=content,
            prompt=prompt,
            assets=assets,
        )
    if intent == "shot-video":
        return _video_plan(content=content, prompt=prompt, assets=assets)
    raise WorkflowRunStepCompilationError("Workflow step intent is unsupported")
