"""Agnes AI Provider — 对接 Agnes 多模态模型 API。

支持三种模型：
  - 文本：agnes-2.0-flash (Chat Completions)
  - 图片：agnes-image-2.1-flash (Images Generations)
  - 视频：agnes-video-v2.0 (Videos Async)

所有请求兼容 OpenAI API 格式。
"""

import asyncio
import logging
from math import isfinite
from typing import Any, AsyncIterator

import httpx

logger = logging.getLogger(__name__)

PROVIDER_STATUS_MAP = {
    "queued": "queued",
    "pending": "queued",
    "created": "queued",
    "running": "running",
    "processing": "running",
    "in_progress": "running",
    "completed": "succeeded",
    "complete": "succeeded",
    "succeeded": "succeeded",
    "success": "succeeded",
    "failed": "failed",
    "error": "failed",
    "cancelled": "failed",
    "canceled": "failed",
    "timeout": "timed_out",
    "timed_out": "timed_out",
}


def normalize_provider_status(provider_status: str | None) -> str:
    if provider_status is None:
        return "running"
    return PROVIDER_STATUS_MAP.get(provider_status.lower(), "running")


def extract_provider_progress_percent(response: object) -> float | None:
    if not isinstance(response, dict):
        return None
    containers = [response]
    data = response.get("data")
    if isinstance(data, dict):
        containers.append(data)
    for container in containers:
        for field in ("progress_percent", "progress", "percentage", "percent"):
            value = container.get(field)
            if (
                not isinstance(value, bool)
                and isinstance(value, (int, float))
                and isfinite(float(value))
                and 0 <= float(value) <= 100
            ):
                return float(value)
    return None


class AgnesProvider:
    """Agnes AI 多模态模型统一入口。"""

    def __init__(self, api_key: str, base_url: str = "https://apihub.agnes-ai.com"):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=httpx.Timeout(300.0, connect=10.0),
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        )

    async def chat(self, model: str, messages: list[dict], **kwargs: Any) -> dict:
        """文本生成 / 图片理解 / 工具调用。

        Args:
            model: agnes-2.0-flash 或 agnes-1.5-flash
            messages: OpenAI 格式的 messages 数组
            **kwargs: temperature, max_tokens, stream, tools 等

        Returns:
            完整的 ChatCompletion 响应 dict
        """
        payload = {"model": model, "messages": messages, **kwargs}
        resp = await self._client.post("/v1/chat/completions", json=payload)
        resp.raise_for_status()
        return resp.json()

    async def chat_stream(self, model: str, messages: list[dict], **kwargs: Any) -> AsyncIterator[str]:
        """流式文本生成，yield SSE 行。"""
        kwargs["stream"] = True
        payload = {"model": model, "messages": messages, **kwargs}
        async with self._client.stream("POST", "/v1/chat/completions", json=payload) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if line.startswith("data: "):
                    yield line[6:]

    async def generate_image(
        self,
        prompt: str,
        size: str = "1024x768",
        model: str = "agnes-image-2.1-flash",
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
        payload: dict[str, Any] = {
            "model": model,
            "prompt": prompt,
            "size": size,
        }
        if ratio is not None:
            payload["ratio"] = ratio
        if return_base64:
            payload["return_base64"] = True

        extra_body: dict[str, Any] = {"response_format": response_format}
        if image is not None:
            extra_body["image"] = image
        payload["extra_body"] = extra_body

        resp = await self._client.post("/v1/images/generations", json=payload)
        resp.raise_for_status()
        return resp.json()

    async def generate_video(
        self,
        prompt: str,
        model: str = "agnes-video-v2.0",
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
        payload: dict[str, Any] = {
            "model": model,
            "prompt": prompt,
            "height": height,
            "width": width,
            "num_frames": num_frames,
            "frame_rate": frame_rate,
        }

        if mode == "img2vid" and image:
            payload["image"] = image
        elif mode == "keyframes" and extra_images:
            payload["extra_body"] = {
                "image": extra_images,
                "mode": "keyframes",
            }

        if negative_prompt:
            payload["negative_prompt"] = negative_prompt

        resp = await self._client.post("/v1/videos", json=payload)
        resp.raise_for_status()
        return resp.json()

    async def poll_video_result(self, video_id: str) -> dict:
        """查询视频生成结果（推荐方式：使用 video_id）。

        Args:
            video_id: 视频任务返回的 video_id

        Returns:
            任务状态响应，status 为 "completed" 时 url 可用
        """
        resp = await self._client.get("/agnesapi", params={"video_id": video_id})
        resp.raise_for_status()
        return resp.json()

    async def close(self):
        """关闭 HTTP 客户端。"""
        await self._client.aclose()

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        await self.close()
