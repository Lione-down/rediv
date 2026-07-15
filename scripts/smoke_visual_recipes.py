#!/usr/bin/env python3
from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import os
import sys
import time
from datetime import UTC, datetime
from pathlib import Path

import httpx


CASES = (
    {
        "id": "photo-character",
        "recipe_id": "character-sheet",
        "reference_url": "https://raw.githubusercontent.com/opencv/opencv/master/samples/data/lena.jpg",
        "source_page": "https://github.com/opencv/opencv/blob/master/samples/data/lena.jpg",
        "license": "Upstream OpenCV test asset; see source repository",
    },
    {
        "id": "illustrated-character",
        "recipe_id": "character-sheet",
        "reference_url": "https://raw.githubusercontent.com/python-pillow/Pillow/main/Tests/images/hopper.png",
        "source_page": "https://github.com/python-pillow/Pillow/blob/main/Tests/images/hopper.png",
        "license": "Upstream Pillow test asset; see source repository",
    },
    {
        "id": "photo-scene",
        "recipe_id": "scene-multiview",
        "reference_url": "https://raw.githubusercontent.com/opencv/opencv/master/samples/data/graf1.png",
        "source_page": "https://github.com/opencv/opencv/blob/master/samples/data/graf1.png",
        "license": "Upstream OpenCV test asset; see source repository",
    },
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Bounded real Agnes visual-recipe smoke")
    parser.add_argument("--execute", action="store_true", help="Perform selected authorized image calls, never more than three")
    parser.add_argument("--case", choices=tuple(case["id"] for case in CASES), action="append", dest="case_ids")
    parser.add_argument("--output-root", default="output/agnes")
    return parser.parse_args(argv)


def redacted_identifier(value: object) -> str | None:
    if not isinstance(value, str) or not value.strip():
        return None
    return hashlib.sha256(value.strip().encode("utf-8")).hexdigest()[:12]


async def execute(output_root: Path, cases: tuple[dict[str, str], ...]) -> int:
    project_root = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(project_root / "backend"))
    from core.agnes_provider import AgnesProvider
    from core.generation_results import extract_image_url
    from core.image_generation_recipes import resolve_image_generation_recipe
    from settings.config import settings

    api_key = os.environ.get("REVID_AGNES_API_KEY", "").strip()
    if not api_key:
        print("BLOCKED: REVID_AGNES_API_KEY is not set; no Agnes call was made.")
        return 2

    run_id = f"t5-071-{datetime.now(UTC).strftime('%Y%m%dT%H%M%SZ')}"
    run_dir = (project_root / output_root / run_id).resolve()
    run_dir.mkdir(parents=True, exist_ok=False)
    provider = AgnesProvider(api_key, settings.agnes_base_url)
    metadata: dict[str, object] = {
        "run_id": run_id,
        "provider": "agnes",
        "model": settings.agnes_model_image,
        "authorized_call_limit": len(cases),
        "cases": [],
    }
    try:
        async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as downloader:
            for case in cases:
                recipe = resolve_image_generation_recipe(case["recipe_id"], 2)
                started_at = time.perf_counter()
                response = await provider.generate_image(
                    model=settings.agnes_model_image,
                    prompt=recipe.prompt,
                    image=[case["reference_url"]],
                    size=recipe.output_size,
                    response_format="url",
                )
                result_url = extract_image_url(response)
                result = await downloader.get(result_url)
                result.raise_for_status()
                content_type = result.headers.get("content-type", "").split(";", 1)[0].lower()
                if content_type not in {"image/jpeg", "image/png", "image/webp"}:
                    raise RuntimeError(f"unexpected generated content type: {content_type or 'missing'}")
                if len(result.content) > 20 * 1024 * 1024:
                    raise RuntimeError("generated image exceeds 20 MiB evidence limit")
                suffix = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}[content_type]
                output_path = run_dir / f"{case['id']}{suffix}"
                output_path.write_bytes(result.content)
                response_id = response.get("id") if isinstance(response, dict) else None
                metadata["cases"].append({
                    "id": case["id"],
                    "recipe_id": recipe.id,
                    "recipe_version": recipe.version,
                    "reference_page": case["source_page"],
                    "reference_license": case["license"],
                    "reference_url": case["reference_url"],
                    "output_file": output_path.name,
                    "output_sha256": hashlib.sha256(result.content).hexdigest(),
                    "output_bytes": len(result.content),
                    "provider_request_id_hash": redacted_identifier(response_id),
                    "duration_ms": round((time.perf_counter() - started_at) * 1000),
                    "provider_status": "succeeded",
                    "human_verdict": "pending",
                })
                print(json.dumps({"case": case["id"], "status": "succeeded", "evidence": str(output_path)}, ensure_ascii=False))
    except Exception as exc:
        metadata["failure"] = {"type": type(exc).__name__, "message": str(exc)[:240]}
        (run_dir / "metadata.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
        print(json.dumps({"status": "failed", "evidence_dir": str(run_dir), "error_type": type(exc).__name__}, ensure_ascii=False))
        return 1
    finally:
        await provider.close()
    (run_dir / "metadata.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"status": "succeeded", "calls": len(cases), "evidence_dir": str(run_dir)}, ensure_ascii=False))
    return 0


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    selected_cases = tuple(case for case in CASES if not args.case_ids or case["id"] in args.case_ids)
    if not args.execute:
        print(json.dumps({
            "status": "dry_run",
            "calls": len(selected_cases),
            "cases": [{"id": case["id"], "recipe_id": case["recipe_id"], "version": 2} for case in selected_cases],
            "message": "No Agnes call was made. Re-run with --execute after Human Owner authorization.",
        }, ensure_ascii=False))
        return 0
    return asyncio.run(execute(Path(args.output_root), selected_cases))


if __name__ == "__main__":
    raise SystemExit(main())
