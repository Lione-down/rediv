"""Agnes AI Provider — 对接 Agnes 多模态模型 API。

支持三种模型：
  - 文本：agnes-2.0-flash (Chat Completions)
  - 图片：agnes-image-2.1-flash (Images Generations)
  - 视频：agnes-video-v2.0 (Videos Async)

所有请求兼容 OpenAI API 格式。
"""

import asyncio
import logging
from typing import Any, AsyncIterator

import httpx

from core.agnes_contract import (
    AGNES_CONTRACT,
    IMAGE_CONTRACT,
    TEXT_CONTRACT,
    VIDEO_CONTRACT,
    AgnesProviderError,
    build_image_request,
    build_text_request,
    build_video_poll_request,
    build_video_request,
)
from settings.config import Settings, settings, validate_agnes_base_url

logger = logging.getLogger(__name__)


class AgnesProviderResponseError(RuntimeError):
    pass

PROVIDER_STATUS_MAP = {
    "queued": "queued",
    "in_progress": "running",
    "completed": "succeeded",
    "failed": "failed",
}


def normalize_provider_status(provider_status: str | None) -> str:
    if not isinstance(provider_status, str) or provider_status not in PROVIDER_STATUS_MAP:
        raise AgnesProviderResponseError("Provider returned an unsupported video task status")
    return PROVIDER_STATUS_MAP[provider_status]


def extract_provider_progress_percent(response: object) -> int | None:
    if not isinstance(response, dict):
        return None
    value = response.get("progress")
    if isinstance(value, bool) or not isinstance(value, int) or not 0 <= value <= 100:
        return None
    return value


class AgnesProvider:
    """Agnes AI 多模态模型统一入口。"""

    def __init__(
        self,
        api_key: str,
        base_url: str | None = None,
        *,
        config: Settings | None = None,
        transport: httpx.AsyncBaseTransport | None = None,
    ):
        runtime_settings = settings if config is None else config
        self.api_key = api_key
        self.base_url = validate_agnes_base_url(
            base_url or AGNES_CONTRACT.base_url,
            runtime_settings,
        )
        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            transport=transport,
            limits=httpx.Limits(
                max_connections=runtime_settings.agnes_admission_global_limit,
                max_keepalive_connections=runtime_settings.agnes_admission_global_limit,
            ),
            timeout=httpx.Timeout(
                connect=runtime_settings.agnes_http_connect_timeout_seconds,
                pool=runtime_settings.agnes_http_pool_timeout_seconds,
                read=runtime_settings.agnes_http_read_timeout_seconds,
                write=runtime_settings.agnes_http_write_timeout_seconds,
            ),
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        )

    @staticmethod
    def _response_json(response: httpx.Response) -> dict[str, Any]:
        if response.is_error:
            raise AgnesProviderError.from_response(response)
        try:
            payload = response.json()
        except (ValueError, UnicodeDecodeError) as error:
            raise AgnesProviderResponseError("Provider returned malformed JSON") from error
        if not isinstance(payload, dict):
            raise AgnesProviderResponseError("Provider response must be a JSON object")
        return payload

    async def chat(
        self,
        model: str,
        messages: list[dict],
        *,
        temperature: float | None = None,
    ) -> dict:
        """文本生成 / 图片理解 / 工具调用。

        Args:
            model: agnes-2.0-flash 或 agnes-1.5-flash
            messages: OpenAI 格式的 messages 数组
            **kwargs: temperature, max_tokens, stream, tools 等

        Returns:
            完整的 ChatCompletion 响应 dict
        """
        payload = build_text_request(
            model=model,
            messages=messages,
            temperature=temperature,
        )
        resp = await self._client.post(TEXT_CONTRACT.submit_path, json=payload)
        return self._response_json(resp)

    async def chat_stream(
        self,
        model: str,
        messages: list[dict],
        *,
        temperature: float | None = None,
    ) -> AsyncIterator[str]:
        """流式文本生成，yield SSE 行。"""
        payload = build_text_request(
            model=model,
            messages=messages,
            temperature=temperature,
            stream=True,
        )
        async with self._client.stream("POST", TEXT_CONTRACT.submit_path, json=payload) as resp:
            if resp.is_error:
                await resp.aread()
                raise AgnesProviderError.from_response(resp)
            async for line in resp.aiter_lines():
                if line.startswith("data: "):
                    yield line[6:]

    async def generate_image(
        self,
        prompt: str,
        size: str = "1024x768",
        model: str = IMAGE_CONTRACT.model,
        return_base64: bool = False,
        image: list[str] | None = None,
        response_format: str = "url",
        ratio: str | None = None,
    ) -> dict:
        """文生图 / 图生图。

        Args:
            prompt: 生成/编辑指令
            size: 输出尺寸，如 "1024x768"
            model: agnes-image-2.1-flash 或 agnes-image-2.0-flash
            return_base64: 是否返回 Base64
            image: 图生图输入图片 URL 数组
            response_format: "url" 或 "b64_json"

        Returns:
            图片生成响应 dict，URL 在 data[0].url，Base64 在 data[0].b64_json
        """
        payload = build_image_request(
            model=model,
            prompt=prompt,
            size=size,
            ratio=ratio,
            images=image,
            return_base64=return_base64,
            response_format=response_format,
        )

        resp = await self._client.post(IMAGE_CONTRACT.submit_path, json=payload)
        return self._response_json(resp)

    async def generate_video(
        self,
        prompt: str,
        model: str = VIDEO_CONTRACT.model,
        image: str | None = None,
        extra_images: list[str] | None = None,
        mode: str = "ti2vid",
        width: int = 1152,
        height: int = 768,
        num_frames: int = 121,
        frame_rate: int = 24,
        negative_prompt: str | None = None,
    ) -> dict:
        """创建视频生成任务（异步）。

        Args:
            prompt: 视频描述
            model: agnes-video-v2.0
            image: 图生图输入图片 URL
            extra_images: 多图视频输入图片数组
            mode: "ti2vid" | "img2vid" | "keyframes"
            width/height: 视频分辨率
            num_frames: 帧数，必须 ≤ 441 且满足 8n+1
            frame_rate: 帧率 1-60
            negative_prompt: 负向提示词

        Returns:
            任务创建响应，包含 task_id 和 video_id
        """
        payload = build_video_request(
            model=model,
            prompt=prompt,
            image=image,
            extra_images=extra_images,
            mode=mode,
            width=width,
            height=height,
            num_frames=num_frames,
            frame_rate=frame_rate,
            negative_prompt=negative_prompt,
        )

        resp = await self._client.post(VIDEO_CONTRACT.submit_path, json=payload)
        return self._response_json(resp)

    async def poll_video_result(self, video_id: str) -> dict:
        """查询视频生成结果（推荐方式：使用 video_id）。

        Args:
            video_id: 视频任务返回的 video_id

        Returns:
            任务状态响应，status 为 "completed" 时 url 可用
        """
        path, params = build_video_poll_request(video_id)
        resp = await self._client.get(path, params=params)
        return self._response_json(resp)

    async def close(self):
        """关闭 HTTP 客户端。"""
        await self._client.aclose()

    @property
    def is_closed(self) -> bool:
        return self._client.is_closed

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        await self.close()
