from __future__ import annotations

import hashlib
from typing import Any, Literal


ScriptAuthoringIntent = Literal["script_draft", "script_refine"]
ScriptAuthoringLocale = Literal["zh-CN", "en-US"]

SCRIPT_BRIEF_MAX_LENGTH = 4_000
SCRIPT_SOURCE_MAX_LENGTH = 12_000
SCRIPT_OUTPUT_MAX_LENGTH = 12_000


class ScriptAuthoringOutputError(ValueError):
    pass


def build_script_authoring_capabilities(*, model: str) -> dict:
    return {
        "contract_version": 1,
        "available": True,
        "model": model,
        "model_label": "Agnes 2.0 Flash",
        "intents": ["script_draft", "script_refine"],
        "locales": ["zh-CN", "en-US"],
        "default_locale": "zh-CN",
        "brief_max_length": SCRIPT_BRIEF_MAX_LENGTH,
        "source_max_length": SCRIPT_SOURCE_MAX_LENGTH,
        "output_max_length": SCRIPT_OUTPUT_MAX_LENGTH,
        "creates_media": False,
        "runs_cinematic_decomposition": False,
    }


def build_script_authoring_messages(
    *,
    intent: ScriptAuthoringIntent,
    locale: ScriptAuthoringLocale,
    brief: str | None = None,
    source_text: str | None = None,
    instruction: str | None = None,
    image_urls: list[str] | None = None,
) -> list[dict[str, Any]]:
    shared = (
        f"Return one editable script in locale {locale}. Output plain text only, without Markdown fences, "
        "analysis, commentary, or downstream shot/media generation. Keep the result within 12000 characters."
    )
    if intent == "script_draft":
        user_text = f"Create a complete script from this bounded creative brief:\n<brief>\n{brief}\n</brief>"
        user_content: str | list[dict[str, Any]] = user_text
        if image_urls:
            user_content = [
                {"type": "text", "text": f"{user_text}\nUse the attached images as visual story references."},
                *[
                    {"type": "image_url", "image_url": {"url": image_url}}
                    for image_url in image_urls
                ],
            ]
        return [
            {"role": "system", "content": f"You are Revid's script authoring assistant. {shared}"},
            {"role": "user", "content": user_content},
        ]
    return [
        {
            "role": "system",
            "content": (
                "You are Revid's script editing assistant. Preserve established facts, characters, intent, and ending "
                f"unless the instruction explicitly changes them. {shared}"
            ),
        },
        {
            "role": "user",
            "content": (
                f"Apply this instruction:\n<instruction>\n{instruction}\n</instruction>\n"
                f"to this source script:\n<source_script>\n{source_text}\n</source_script>"
            ),
        },
    ]


def validate_script_authoring_output(value: str) -> str:
    normalized = value.strip()
    if not normalized or len(normalized) > SCRIPT_OUTPUT_MAX_LENGTH:
        raise ScriptAuthoringOutputError("Provider returned an invalid script length")
    if "```" in normalized:
        raise ScriptAuthoringOutputError("Provider returned a fenced script instead of editable plain text")
    return normalized


def script_authoring_snapshot(
    *,
    intent: ScriptAuthoringIntent,
    locale: ScriptAuthoringLocale,
    source_node_id: str,
    canvas_revision: int,
    brief: str | None,
    source_text: str | None,
    instruction: str | None,
    reference_asset_ids: list[str] | None = None,
) -> dict:
    snapshot = {
        "contract_version": 1,
        "intent": intent,
        "locale": locale,
        "source_node_id": source_node_id,
        "canvas_revision": canvas_revision,
    }
    if reference_asset_ids:
        snapshot["reference_asset_ids"] = list(dict.fromkeys(reference_asset_ids))
    for field, value in (
        ("brief_digest", brief),
        ("source_digest", source_text),
        ("instruction_digest", instruction),
    ):
        if value is not None:
            snapshot[field] = hashlib.sha256(value.encode("utf-8")).hexdigest()
    return snapshot
