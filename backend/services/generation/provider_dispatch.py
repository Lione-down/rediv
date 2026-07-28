from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Callable

from core.agnes_provider import (
    extract_provider_progress_percent,
    normalize_provider_status,
)
from core.generation_provider import GenerationProvider
from core.generation_results import (
    ProviderResultError,
    extract_image_url,
    extract_text_content,
    validate_https_url,
    validate_optional_provider_identifier,
    validate_provider_identifier,
)
from core.generation_task_utils import extract_provider_request_id
from schemas.workflow_template import WorkflowTemplateProviderProjection


@dataclass(frozen=True)
class ProviderDispatchResult:
    asset_type: str
    content_text: str | None
    url: str | None
    provider_request_id: str | None
    source_model: str


class GenerationProviderDispatcher:
    def __init__(
        self,
        provider: GenerationProvider,
        *,
        poll_interval_seconds: float = 5,
        max_poll_attempts: int = 120,
    ) -> None:
        self.provider = provider
        self.poll_interval_seconds = poll_interval_seconds
        self.max_poll_attempts = max_poll_attempts

    async def dispatch(
        self,
        job: dict,
        persist_provider_request_id: Callable[[str], object],
        persist_progress: Callable[[int], object] | None = None,
    ) -> ProviderDispatchResult:
        request_parameters = job.get("request_parameters") or {}
        input_payload = request_parameters.get("input")
        if (
            request_parameters.get("contract") != "revid.generation-job.v2"
            or not isinstance(input_payload, dict)
            or not isinstance(input_payload.get("prompt"), str)
        ):
            raise ValueError("Generation job request snapshot is invalid")
        prompt = input_payload["prompt"]
        model = job["model"]
        workflow_projection = self._workflow_projection(
            input_payload,
            media_type=job["media_type"],
            model=model,
            prompt=prompt,
        )
        if job["media_type"] in {"text", "script"}:
            response = await self.provider.chat(
                model=model,
                messages=[{"role": "user", "content": prompt}],
            )
            provider_request_id = validate_optional_provider_identifier(
                extract_provider_request_id(response, "id", "request_id")
            )
            if provider_request_id:
                persist_provider_request_id(provider_request_id)
            return ProviderDispatchResult(
                asset_type="prompt",
                content_text=extract_text_content(response),
                url=None,
                provider_request_id=provider_request_id,
                source_model=model,
            )
        if job["media_type"] == "image":
            image_options = (
                self._workflow_image_options(workflow_projection)
                if workflow_projection is not None
                else {}
            )
            response = await self.provider.generate_image(
                model=model,
                prompt=prompt,
                **image_options,
            )
            provider_request_id = validate_optional_provider_identifier(
                extract_provider_request_id(response, "id", "request_id")
            )
            if provider_request_id:
                persist_provider_request_id(provider_request_id)
            return ProviderDispatchResult(
                asset_type="image",
                content_text=None,
                url=extract_image_url(response),
                provider_request_id=provider_request_id,
                source_model=model,
            )
        if job["media_type"] != "video":
            raise ValueError("Generation job media type is unsupported")
        provider_request_id = validate_optional_provider_identifier(
            job.get("provider_request_id")
        )
        if provider_request_id is None:
            video_options = (
                self._workflow_video_options(workflow_projection)
                if workflow_projection is not None
                else {}
            )
            create_response = await self.provider.generate_video(
                model=model,
                prompt=prompt,
                **video_options,
            )
            provider_request_id = self._video_id(create_response)
            persist_provider_request_id(provider_request_id)
        video_url = await self._poll_video(
            provider_request_id,
            persist_progress or (lambda _progress: None),
        )
        return ProviderDispatchResult(
            asset_type="video",
            content_text=None,
            url=video_url,
            provider_request_id=provider_request_id,
            source_model=model,
        )

    @staticmethod
    def _workflow_projection(
        input_payload: dict,
        *,
        media_type: str,
        model: str,
        prompt: str,
    ) -> WorkflowTemplateProviderProjection | None:
        workflow_step = input_payload.get("workflow_step")
        provider_request = input_payload.get("provider_request")
        if workflow_step is None and provider_request is None:
            return None
        if (
            not isinstance(workflow_step, dict)
            or workflow_step.get("contract_version") != 1
            or not isinstance(workflow_step.get("run_id"), str)
            or not isinstance(workflow_step.get("intent"), str)
            or not isinstance(provider_request, dict)
            or set(provider_request) != {"contract_id", "request"}
        ):
            raise ValueError("Workflow generation projection is invalid")
        projection = WorkflowTemplateProviderProjection.model_validate(
            {
                "name": "durable workflow-run projection",
                "projection_version": 1,
                "provider": "agnes",
                "contract_id": provider_request["contract_id"],
                "intent": workflow_step["intent"],
                "request": provider_request["request"],
            }
        )
        request = projection.request
        expected_media = (
            "image"
            if projection.contract_id.startswith("agnes.image")
            else "video"
            if projection.contract_id.startswith("agnes.video")
            else "script"
        )
        if (
            expected_media != media_type
            or request.get("model") != model
            or request.get("prompt") != prompt
        ):
            raise ValueError("Workflow generation projection changed")
        return projection

    @staticmethod
    def _workflow_image_options(
        projection: WorkflowTemplateProviderProjection,
    ) -> dict:
        request = projection.request
        extra_body = request["extra_body"]
        options = {
            "image": extra_body["image"],
            "response_format": extra_body["response_format"],
        }
        if "size" in request:
            options["size"] = request["size"]
        if "ratio" in request:
            options["ratio"] = request["ratio"]
        return options

    @staticmethod
    def _workflow_video_options(
        projection: WorkflowTemplateProviderProjection,
    ) -> dict:
        request = projection.request
        options = {
            key: request[key]
            for key in (
                "width",
                "height",
                "num_frames",
                "frame_rate",
                "negative_prompt",
            )
            if key in request
        }
        if "image" in request:
            options.update({"image": request["image"], "mode": "img2vid"})
        elif "extra_body" in request:
            options.update(
                {
                    "extra_images": request["extra_body"]["image"],
                    "mode": "keyframes",
                }
            )
        return options

    @staticmethod
    def _video_id(response: object) -> str:
        if not isinstance(response, dict):
            raise ProviderResultError("Provider returned invalid video task data")
        candidate = response.get("video_id")
        try:
            return validate_provider_identifier(candidate)
        except ProviderResultError as error:
            raise ProviderResultError("Provider returned invalid video task identifier") from error

    async def _poll_video(
        self,
        provider_request_id: str,
        persist_progress: Callable[[int], object],
    ) -> str:
        for attempt in range(self.max_poll_attempts):
            response = await self.provider.poll_video_result(provider_request_id)
            raw_status = response.get("status") if isinstance(response, dict) else None
            provider_status = normalize_provider_status(
                raw_status if isinstance(raw_status, str) else None
            )
            progress = extract_provider_progress_percent(response)
            if progress is None:
                raise ProviderResultError("Provider returned invalid video task progress")
            if provider_status == "succeeded" and progress != 100:
                raise ProviderResultError("Provider returned contradictory completed video progress")
            persist_progress(progress)
            if provider_status == "succeeded":
                metadata = response.get("metadata")
                candidate = metadata.get("url") if isinstance(metadata, dict) else None
                return validate_https_url(candidate, media_type="video")
            if provider_status == "failed":
                raise ProviderResultError("Provider reported video generation failure")
            if attempt < self.max_poll_attempts - 1:
                await asyncio.sleep(self.poll_interval_seconds)
        raise TimeoutError("Provider video generation timed out")
