import asyncio
import hashlib
import time
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from api.generation_common import fingerprint_generation_request, map_generation_error, resolve_cinematic_generation_handoff
from controllers import generation_transactions as generation_controller
from controllers import canvas_documents as document_controller
from controllers.store import store
from controllers.canvases import CanvasDomainError
from api.canvases import map_canvas_domain_error
from core.agnes_contract import TEXT_CONTRACT
from core.agnes_image_reference import AgnesImageReferenceError, resolve_agnes_public_image_url
from core.generation_provider import GenerationProvider, get_generation_provider
from core.generation_results import (
    ProviderResultError,
    extract_text_content,
    validate_optional_provider_identifier,
)
from core.generation_task_utils import (
    elapsed_ms,
    error_code_for_exception,
    extract_provider_request_id,
    provider_error_message,
    provider_failure_http_status,
    provider_request_id_for_exception,
    safe_retry_after_seconds,
    sanitize_error_message,
    status_for_error_code,
)
from core.security import current_user
from core.script_authoring_contract import (
    ScriptAuthoringOutputError,
    build_script_authoring_messages,
    script_authoring_snapshot,
    validate_script_authoring_output,
)
from core.story_director_skill import StoryDirectorSkillError, merge_story_production
from core.story_director_contract import (
    StoryDirectorOutputError,
    build_story_director_tool_contract,
    extract_story_director_tool_arguments,
)
from schemas.generation import TextGenerateRequest, TextGenerateResponse
from schemas.cinematic_sequence import CinematicSequenceState
from schemas.shot_schema import CinematicShotSchemaDocument
from schemas.story_production import StoryProductionDocument
from services.generation.story_director_executor import (
    StoryDirectorExecutionError,
    execute_story_director_async,
)
from services.workflow_templates.story_lineage import (
    WorkflowTemplateStoryLineageError,
    resolve_workflow_template_story_lineage,
)


MODEL_NAME = TEXT_CONTRACT.model

router = APIRouter(prefix="/api", tags=["text-generate"])


def _resolve_text_model(payload: TextGenerateRequest) -> str:
    model_name = payload.model_id or MODEL_NAME
    if model_name not in TEXT_CONTRACT.models:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "text_model_unsupported",
                "message": "所选脚本模型当前不可用，请重新选择。",
            },
        )
    return model_name


def _text_generation_failure_detail(error_code: str) -> dict:
    if error_code == "provider_result_invalid":
        return {
            "code": error_code,
            "message": "模型返回的脚本或分镜结构无效，请调整生成要求后重试。",
            "retryable": False,
            "diagnostic": {
                "stage": "provider_response_validation",
                "contract": "text-generation.v1",
            },
        }
    if error_code in {"invalid_request", "unsupported_parameter", "provider_rejected"}:
        return {
            "code": error_code,
            "message": "脚本生成请求未被模型服务接受，请检查当前内容和模型后重试。",
            "retryable": False,
        }
    if error_code in {"provider_rate_limited", "rate_limited"}:
        return {
            "code": error_code,
            "message": "脚本模型请求过于频繁，请稍后重试。",
            "retryable": True,
        }
    return {
        "code": error_code,
        "message": "脚本模型服务暂时不可用，请稍后重试。",
        "retryable": True,
    }


def _script_authoring_lineage(snapshot: dict, *, task_id: str, model_name: str) -> dict:
    return {
        "contract_version": 1,
        "intent": snapshot["intent"],
        "locale": snapshot["locale"],
        "source_node_id": snapshot["source_node_id"],
        "source_task_id": task_id,
        "source_model": model_name,
        "canvas_revision": snapshot["canvas_revision"],
    }


def _resolve_script_authoring_context(
    payload: TextGenerateRequest,
    user_id: str,
) -> tuple[dict | None, dict | None, dict | None]:
    if payload.intent == "freeform":
        return None, None, None
    try:
        document = document_controller.get_document(
            payload.project_id,
            payload.origin_canvas_id,
            user_id,
        )
    except CanvasDomainError as error:
        raise map_canvas_domain_error(error) from error
    source = next((node for node in document["nodes"] if node["id"] == payload.canvas_node_id), None)
    content = source.get("content") if isinstance(source, dict) else None
    if (
        not isinstance(content, dict)
        or source["node_type"] != "script"
        or source["is_locked"]
        or source["parent_node_id"] is not None
        or content.get("subtype") != "script"
        or content.get("serialization_version") != 1
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "script_source_unavailable", "message": "Script source is no longer eligible"},
        )
    current_text = content.get("text", "")
    if not isinstance(current_text, str):
        current_text = ""
    if document["revision"] != payload.canvas_revision or (
        payload.intent == "script_refine" and current_text.strip() != payload.source_text
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "script_source_stale", "message": "Script source changed before submission"},
        )
    snapshot = script_authoring_snapshot(
        intent=payload.intent,
        locale=payload.locale,
        source_node_id=payload.canvas_node_id,
        canvas_revision=payload.canvas_revision,
        brief=payload.brief,
        source_text=payload.source_text,
        instruction=payload.instruction,
        reference_asset_ids=payload.reference_asset_ids,
    )
    return snapshot, document, source


def _story_director_context(
    payload: TextGenerateRequest,
    document: dict | None,
    source: dict | None,
    *,
    user_id: str,
) -> dict | None:
    request = payload.story_director
    if request is None:
        return None
    if document is None or source is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "story_source_unavailable", "message": "Story source is no longer available"},
        )
    nodes_by_id = {node["id"]: node for node in document["nodes"]}
    connected_sources: list[dict] = []
    seen_ids: set[str] = set()
    for connection in document["connections"]:
        if (
            connection["target_node_id"] != source["id"] or
            connection["source_port"] != "out" or connection["target_port"] != "in" or
            connection["status"] != "active"
        ):
            continue
        candidate = nodes_by_id.get(connection["source_node_id"])
        content = candidate.get("content") if isinstance(candidate, dict) else None
        if (
            not isinstance(content, dict) or candidate["node_type"] != "script" or
            content.get("subtype") != "prompt" or content.get("serialization_version") != 1 or
            candidate["id"] in seen_ids
        ):
            continue
        seen_ids.add(candidate["id"])
        connected_sources.append(candidate)
    actual_source_ids = [candidate["id"] for candidate in connected_sources]
    if actual_source_ids != request.source_node_ids:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "story_source_stale", "message": "Connected story sources changed before submission"},
        )
    source_records = connected_sources or [source]
    source_parts: list[str] = []
    revision_parts: list[str] = []
    for candidate in source_records:
        content = candidate.get("content")
        text = content.get("text", "") if isinstance(content, dict) else ""
        if not isinstance(text, str) or not text.strip():
            continue
        normalized = text.strip()
        source_parts.append(normalized)
        revision_parts.append(f"{candidate['id']}\n{normalized}")
    source_text = "\n\n".join(source_parts)
    if not source_text or len(source_text) > 12_000:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "story_source_required", "message": "Connect usable Prompt/Text content before generating storyboard"},
        )
    source_revision = hashlib.sha256("\n\n".join(revision_parts).encode("utf-8")).hexdigest()
    source_content = source.get("content")
    source_template_lineage = (
        source_content.get("workflow_template_lineage")
        if isinstance(source_content, dict)
        else None
    )
    requested_template_lineage = (
        request.template_lineage.model_dump(mode="json")
        if request.template_lineage is not None
        else None
    )
    if source_template_lineage != requested_template_lineage:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "workflow_template_story_lineage_stale",
                "message": "Template Script lineage changed before submission",
            },
        )
    template_lineage = None
    if request.template_lineage is not None:
        try:
            template_lineage = resolve_workflow_template_story_lineage(
                lineage=request.template_lineage,
                owner_user_id=user_id,
                project_id=payload.project_id,
                canvas_id=payload.origin_canvas_id or "",
                script_node_id=payload.canvas_node_id,
            )
        except WorkflowTemplateStoryLineageError as error:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "workflow_template_story_lineage_stale",
                    "message": "模板脚本来源已变化，请刷新 Canvas 后重试。",
                },
            ) from error
    current_story = None
    if isinstance(source_content, dict) and source_content.get("story_production") is not None:
        try:
            current_story = StoryProductionDocument.model_validate(source_content["story_production"])
        except ValueError as error:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "story_production_invalid", "message": "Current storyboard is not valid production state"},
            ) from error
        if current_story.template_lineage != request.template_lineage:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "workflow_template_story_lineage_stale",
                    "message": "Template story lineage changed before submission",
                },
            )
    return {
        "source_text": source_text,
        "source_revision": source_revision,
        "source_node_ids": actual_source_ids,
        "requested_shot_count": request.requested_shot_count,
        "current_story": current_story,
        "template_lineage": template_lineage,
    }


def _resolve_script_reference_image_urls(payload: TextGenerateRequest, user_id: str) -> list[str]:
    image_urls: list[str] = []
    for asset_id in payload.reference_asset_ids:
        asset = store.get_asset(asset_id)
        if (
            not asset or asset["user_id"] != user_id or asset["project_id"] != payload.project_id or
            asset["status"] != "active"
        ):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"code": "script_reference_unavailable", "message": "附加素材已失效或不属于当前项目。"},
            )
        if asset["type"] != "image" or not isinstance(asset["url"], str):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"code": "script_reference_unsupported", "message": "脚本写作附件目前仅支持可公开访问的图片。"},
            )
        try:
            image_urls.append(resolve_agnes_public_image_url(asset["url"]))
        except AgnesImageReferenceError as error:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"code": "script_reference_unavailable", "message": "附加图片必须是可公开访问的 HTTPS 地址。"},
            ) from error
    return image_urls


@router.post("/text-generate", response_model=TextGenerateResponse)
async def text_generate(
    payload: TextGenerateRequest,
    user=Depends(current_user),
    provider: GenerationProvider = Depends(get_generation_provider),
):
    model_name = _resolve_text_model(payload)
    authoring_snapshot, authoring_document, authoring_source = _resolve_script_authoring_context(
        payload, user["id"]
    )
    story_context = _story_director_context(
        payload,
        authoring_document,
        authoring_source,
        user_id=user["id"],
    )
    script_reference_image_urls = (
        _resolve_script_reference_image_urls(payload, user["id"])
        if authoring_snapshot else []
    )
    cinematic_handoff = resolve_cinematic_generation_handoff(
        payload.cinematic_handoff,
        user_id=user["id"],
        project_id=payload.project_id,
        canvas_id=payload.origin_canvas_id,
        media_type="script",
        provider_id="agnes",
        model_id=model_name,
        prompt=payload.prompt,
        image_ids=[],
        expected_control_parameters=(
            {
                key: value
                for key, value in payload.cinematic_handoff.generation_parameters.items()
                if key != "image_ids"
            }
            if payload.cinematic_handoff else {}
        ),
    )
    try:
        story_snapshot = (
            {
                "contract_version": 1,
                "source_node_ids": story_context["source_node_ids"],
                "source_revision": story_context["source_revision"],
                "requested_shot_count": story_context["requested_shot_count"],
                "instruction_digest": hashlib.sha256(payload.brief.encode("utf-8")).hexdigest(),
                **(
                    {
                        "template_lineage": story_context[
                            "template_lineage"
                        ].model_dump(mode="json")
                    }
                    if story_context["template_lineage"] is not None
                    else {}
                ),
            }
            if story_context else None
        )
        request_parameters = (
            {"cinematic_skill": cinematic_handoff["request_snapshot"]}
            if cinematic_handoff else
            {
                "script_authoring": authoring_snapshot,
                "story_director": story_snapshot,
            } if story_snapshot else
            {"script_authoring": authoring_snapshot} if authoring_snapshot else None
        )
        start = generation_controller.start_generation_request(
            user_id=user["id"],
            media_type="text",
            provider="agnes",
            model=model_name,
            project_id=payload.project_id,
            origin_canvas_id=payload.origin_canvas_id,
            canvas_node_id=payload.canvas_node_id,
            request_parameters=request_parameters,
            client_request_id=str(payload.client_request_id or uuid4()),
            request_fingerprint=fingerprint_generation_request(
                media_type="text",
                user_id=user["id"],
                project_id=payload.project_id,
                origin_canvas_id=payload.origin_canvas_id,
                canvas_node_id=payload.canvas_node_id,
                provider="agnes",
                model=model_name,
                prompt=payload.prompt,
                image_ids=None,
                request_parameters=request_parameters,
                cinematic_handoff=payload.cinematic_handoff,
            ),
        )
    except generation_controller.GenerationTransactionError as error:
        raise map_generation_error(error) from error
    if start.is_replay:
        replay_story = None
        replay_content = start.replay_outcome["asset"]["content_text"]
        if story_context:
            replay_story = StoryProductionDocument.model_validate_json(replay_content)
            replay_content = replay_story.story.summary
        replay_lineage = (
            _script_authoring_lineage(
                authoring_snapshot,
                task_id=start.replay_outcome["generation_task"]["id"],
                model_name=model_name,
            )
            if authoring_snapshot else None
        )
        return {
            "content": replay_content,
            "script_authoring": replay_lineage,
            "story_production": (
                replay_story.model_dump(mode="json") if replay_story else None
            ),
            **start.replay_outcome,
        }
    task = start.task
    started_at = time.perf_counter()
    provider_request_id: str | None = None
    story_production: StoryProductionDocument | None = None
    persisted_content: str | None = None

    try:
        if story_context:
            latest_story_response: dict | None = None

            async def generate_story(*, model_id: str, messages: list[dict]) -> str:
                nonlocal latest_story_response
                tools, tool_choice = build_story_director_tool_contract()
                latest_story_response = await provider.chat(
                    model=model_id,
                    messages=messages,
                    tools=tools,
                    tool_choice=tool_choice,
                )
                try:
                    return extract_story_director_tool_arguments(latest_story_response)
                except StoryDirectorOutputError:
                    return extract_text_content(latest_story_response)

            story_source = (
                f"{story_context['source_text']}\n\n"
                f"Production instruction:\n{payload.brief}"
            )
            story_production = await execute_story_director_async(
                source_text=story_source,
                source_node_id=payload.canvas_node_id,
                source_revision=story_context["source_revision"],
                model_id=model_name,
                requested_shot_count=story_context["requested_shot_count"],
                generate=generate_story,
                template_lineage=story_context["template_lineage"],
            )
            if story_context["current_story"] is not None:
                story_production = merge_story_production(
                    current=story_context["current_story"],
                    candidate=story_production,
                    target_id=None,
                )
            generated_text = story_production.story.summary
            persisted_content = story_production.model_dump_json()
            response = latest_story_response or {}
        else:
            messages = (
                build_script_authoring_messages(
                intent=payload.intent,
                locale=payload.locale,
                brief=payload.brief,
                source_text=payload.source_text,
                instruction=payload.instruction,
                image_urls=script_reference_image_urls,
                )
                if authoring_snapshot else [{"role": "user", "content": payload.prompt}]
            )
            response = await provider.chat(
                model=model_name,
                messages=messages,
            )
            generated_text = extract_text_content(response)
            if authoring_snapshot:
                generated_text = validate_script_authoring_output(generated_text)
            persisted_content = generated_text
        if payload.cinematic_handoff:
            reference_revisions = {
                reference["source_revision"]
                for reference in payload.cinematic_handoff.submitted_preflight["references"]
            }
            if payload.cinematic_handoff.skill_version == 2:
                sequence = CinematicSequenceState.model_validate_json(generated_text)
                expected_brief = payload.cinematic_handoff.submitted_preflight["canonical_request"]["director_brief"]
                if (
                    sequence.source_script_node_id != payload.canvas_node_id
                    or sequence.source_revision not in reference_revisions
                    or sequence.director_brief.model_dump(mode="json") != expected_brief
                ):
                    raise ProviderResultError("Provider returned a sequence for the wrong director source")
                generated_text = sequence.model_dump_json()
            else:
                shot_document = CinematicShotSchemaDocument.model_validate_json(generated_text)
                if (
                    shot_document.source_script_node_id != payload.canvas_node_id
                    or shot_document.source_revision not in reference_revisions
                ):
                    raise ProviderResultError("Provider returned a shot document for the wrong script source")
                generated_text = shot_document.model_dump_json()
        provider_request_id = validate_optional_provider_identifier(
            extract_provider_request_id(response, "id", "request_id")
        )
    except asyncio.CancelledError:
        generation_controller.fail_generation_task(
            task["id"],
            status="failed",
            duration_ms=elapsed_ms(started_at),
            provider_request_id=provider_request_id,
            error_code="request_cancelled",
            error_message="Text generation request was cancelled",
        )
        raise
    except Exception as exc:
        provider_request_id = provider_request_id_for_exception(exc) or provider_request_id
        error_code = (
            "provider_result_invalid"
            if isinstance(
                exc,
                ProviderResultError | ScriptAuthoringOutputError |
                StoryDirectorExecutionError | StoryDirectorSkillError,
            )
            else error_code_for_exception(exc)
        )
        generation_controller.fail_generation_task(
            task["id"],
            status=status_for_error_code(error_code),
            duration_ms=elapsed_ms(started_at),
            provider_request_id=provider_request_id,
            error_code=error_code,
            error_message=provider_error_message(exc),
        )
        if isinstance(exc, HTTPException):
            raise
        retry_after = safe_retry_after_seconds(exc)
        raise HTTPException(
            status_code=provider_failure_http_status(error_code),
            detail=_text_generation_failure_detail(error_code),
            headers={"Retry-After": str(retry_after)} if retry_after is not None else None,
        ) from exc

    try:
        result = generation_controller.complete_generation_task(
            task["id"],
            asset_type="prompt",
            url=None,
            content_text=persisted_content or generated_text,
            source_model=model_name,
            duration_ms=elapsed_ms(started_at),
            provider_request_id=provider_request_id,
        )
    except generation_controller.GenerationPersistenceError as error:
        generation_controller.fail_generation_task(
            task["id"],
            status="failed",
            duration_ms=elapsed_ms(started_at),
            provider_request_id=provider_request_id,
            error_code="asset_persistence_error",
            error_message=sanitize_error_message(error.__cause__ or error),
        )
        raise map_generation_error(error) from error
    except generation_controller.GenerationTransactionError as error:
        raise map_generation_error(error) from error
    return {
        "content": generated_text,
        "script_authoring": (
            _script_authoring_lineage(
                authoring_snapshot,
                task_id=task["id"],
                model_name=model_name,
            )
            if authoring_snapshot else None
        ),
        "story_production": (
            story_production.model_dump(mode="json") if story_production else None
        ),
        **result,
    }
