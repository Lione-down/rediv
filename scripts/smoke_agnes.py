#!/usr/bin/env python3
from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
import time
from pathlib import Path


DEFAULT_PROMPTS = {
    "text": "Write one concise storyboard beat for a creator video.",
    "image": "A clean product storyboard frame, cinematic lighting.",
    "video": "A short cinematic shot of a creator opening a workspace.",
}


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Dry-run-safe Agnes smoke helper")
    parser.add_argument("--media", choices=("text", "image", "video"), required=True)
    parser.add_argument("--prompt", default=None)
    parser.add_argument("--execute", action="store_true", help="Perform a real Agnes call; may consume provider quota")
    return parser.parse_args(argv)


def _backend_path() -> str:
    return str((Path(__file__).resolve().parents[1] / "backend").resolve())


async def _execute(args: argparse.Namespace) -> int:
    sys.path.insert(0, _backend_path())

    from core.agnes_provider import AgnesProvider
    from core.generation_task_utils import elapsed_ms, extract_provider_request_id, sanitize_error_message
    from settings.config import settings

    api_key = os.environ.get("REVID_AGNES_API_KEY", "").strip()
    if not api_key:
        print("BLOCKED: REVID_AGNES_API_KEY is not set; no Agnes call was made.")
        return 2

    provider = AgnesProvider(api_key, settings.agnes_base_url)
    model_by_media = {
        "text": settings.agnes_model_text,
        "image": settings.agnes_model_image,
        "video": settings.agnes_model_video,
    }
    prompt = args.prompt or DEFAULT_PROMPTS[args.media]
    started_at = time.perf_counter()
    try:
        if args.media == "text":
            response = await provider.chat(
                model=model_by_media["text"],
                messages=[{"role": "user", "content": prompt}],
            )
            provider_request_id = extract_provider_request_id(response, "id")
        elif args.media == "image":
            response = await provider.generate_image(
                model=model_by_media["image"],
                prompt=prompt,
            )
            provider_request_id = extract_provider_request_id(response, "id")
        else:
            response = await provider.generate_video(
                model=model_by_media["video"],
                prompt=prompt,
            )
            provider_request_id = extract_provider_request_id(response, "video_id", "task_id", "id")
        print(
            json.dumps(
                {
                    "media": args.media,
                    "status": "succeeded",
                    "model": model_by_media[args.media],
                    "provider_request_id": provider_request_id,
                    "duration_ms": elapsed_ms(started_at),
                },
                ensure_ascii=False,
            )
        )
        return 0
    except Exception as exc:
        print(
            json.dumps(
                {
                    "media": args.media,
                    "status": "failed",
                    "error_message": sanitize_error_message(exc),
                    "duration_ms": elapsed_ms(started_at),
                },
                ensure_ascii=False,
            )
        )
        return 1
    finally:
        await provider.close()


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    if not args.execute:
        print(
            json.dumps(
                {
                    "media": args.media,
                    "status": "dry_run",
                    "message": "No Agnes call was made. Re-run with --execute after Human Owner authorization.",
                },
                ensure_ascii=False,
            )
        )
        return 0
    return asyncio.run(_execute(args))


if __name__ == "__main__":
    raise SystemExit(main())
