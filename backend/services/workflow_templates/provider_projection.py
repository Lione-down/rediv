from __future__ import annotations

from core.agnes_contract import build_video_request
from core.generation_parameter_contract import (
    NormalizedVideoParameters,
    VIDEO_MAX_KEYFRAMES,
    VIDEO_MIN_KEYFRAMES,
    VIDEO_MODEL,
)
from schemas.workflow_template import WorkflowTemplateProviderProjection


def compile_workflow_template_video_projection(
    *,
    prompt: str,
    normalized_parameters: NormalizedVideoParameters,
    image_urls: list[str],
) -> WorkflowTemplateProviderProjection:
    if not isinstance(prompt, str) or not prompt.strip():
        raise ValueError("video projection prompt is required")
    if (
        not isinstance(image_urls, list)
        or any(not isinstance(url, str) or not url.strip() for url in image_urls)
    ):
        raise ValueError("video projection image URLs are invalid")

    mode = normalized_parameters.reference_mode
    if mode == "text-to-video":
        if image_urls:
            raise ValueError("text-to-video projection requires zero images")
        request = build_video_request(
            model=VIDEO_MODEL,
            prompt=prompt,
            width=normalized_parameters.width,
            height=normalized_parameters.height,
            num_frames=normalized_parameters.num_frames,
            frame_rate=normalized_parameters.frame_rate,
            negative_prompt=normalized_parameters.negative_prompt,
        )
    elif mode == "image-to-video":
        if len(image_urls) != 1:
            raise ValueError("single image projection requires exactly one image")
        request = build_video_request(
            model=VIDEO_MODEL,
            prompt=prompt,
            image=image_urls[0],
            mode="img2vid",
            width=normalized_parameters.width,
            height=normalized_parameters.height,
            num_frames=normalized_parameters.num_frames,
            frame_rate=normalized_parameters.frame_rate,
            negative_prompt=normalized_parameters.negative_prompt,
        )
    elif mode == "keyframes":
        if not VIDEO_MIN_KEYFRAMES <= len(image_urls) <= VIDEO_MAX_KEYFRAMES:
            raise ValueError("ordered keyframes projection requires two to eight images")
        request = build_video_request(
            model=VIDEO_MODEL,
            prompt=prompt,
            extra_images=image_urls,
            mode="keyframes",
            width=normalized_parameters.width,
            height=normalized_parameters.height,
            num_frames=normalized_parameters.num_frames,
            frame_rate=normalized_parameters.frame_rate,
            negative_prompt=normalized_parameters.negative_prompt,
        )
    else:
        raise ValueError("video projection mode is unsupported")

    return WorkflowTemplateProviderProjection.model_validate(
        {
            "name": f"runtime {mode} projection",
            "projection_version": 1,
            "provider": "agnes",
            "contract_id": "agnes.video-v2.0.v1",
            "intent": "shot-video",
            "request": request,
        }
    )
