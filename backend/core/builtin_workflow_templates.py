from __future__ import annotations

from copy import deepcopy
from datetime import datetime

from core.workflow_template_contract import workflow_template_fingerprint
from schemas.workflow_template import WorkflowTemplateManifest


_BUILTIN_PUBLISHED_AT = datetime(2026, 7, 28)

_PRODUCT_AD_MANIFEST = {
    "schema_id": "revid.workflow-template",
    "schema_version": 1,
    "template_id": "revid.product-ad",
    "template_version": 1,
    "lifecycle": "published",
    "scope": "built_in",
    "metadata": {
        "name": "商品广告短片",
        "category": "commercial",
        "tags": ["product", "15-60s"],
        "description": "从商品 Brief 创建脚本、分镜图和可执行视频卡片",
    },
    "variables": [
        {
            "key": "product_name",
            "type": "text",
            "required": True,
            "label": "商品名称",
            "max_length": 120,
        },
        {
            "key": "shot_count",
            "type": "integer",
            "required": True,
            "label": "镜头数量",
            "default": 6,
            "minimum": 1,
            "maximum": 25,
        },
        {
            "key": "aspect_ratio",
            "type": "enum",
            "required": True,
            "label": "画幅",
            "default": "9:16",
            "options": ["16:9", "9:16", "1:1"],
        },
    ],
    "asset_slots": [
        {
            "slot_id": "product_reference",
            "media_type": "image",
            "role": "identity",
            "required": True,
            "minimum_items": 1,
            "maximum_items": 3,
            "revision_policy": "exact",
        }
    ],
    "graph": {
        "nodes": [
            {"local_id": "brief", "node_type": "text"},
            {"local_id": "script", "node_type": "script"},
            {
                "local_id": "images",
                "node_type": "generation",
                "subtype": "image",
            },
            {
                "local_id": "videos",
                "node_type": "generation",
                "subtype": "video",
            },
        ],
        "connections": [
            {
                "local_id": "brief-script",
                "source_node_local_id": "brief",
                "source_port": "out",
                "target_node_local_id": "script",
                "target_port": "prompt",
            },
            {
                "local_id": "script-images",
                "source_node_local_id": "script",
                "source_port": "out",
                "target_node_local_id": "images",
                "target_port": "prompt",
            },
            {
                "local_id": "images-videos",
                "source_node_local_id": "images",
                "source_port": "out",
                "target_node_local_id": "videos",
                "target_port": "media",
            },
        ],
    },
    "steps": [
        {
            "step_id": "compile-story",
            "node_local_id": "script",
            "intent": "story-production",
            "model_policy": "agnes-text-default",
            "input_bindings": [
                "product_name",
                "shot_count",
                "product_reference",
            ],
            "depends_on": [],
            "capability_requirements": ["text.tool_calling"],
        },
        {
            "step_id": "create-shot-images",
            "node_local_id": "images",
            "intent": "shot-image",
            "model_policy": "agnes-image-quality-default",
            "input_bindings": ["aspect_ratio", "product_reference"],
            "depends_on": ["compile-story"],
            "capability_requirements": ["image.text_or_single_image"],
        },
        {
            "step_id": "create-shot-videos",
            "node_local_id": "videos",
            "intent": "shot-video",
            "model_policy": "agnes-video-default",
            "input_bindings": ["aspect_ratio"],
            "depends_on": ["create-shot-images"],
            "capability_requirements": [
                "video.text_or_single_image_or_keyframes"
            ],
        },
    ],
    "override_policy": {
        "allowed_fields": [
            "variables.product_name",
            "variables.shot_count",
            "variables.aspect_ratio",
            "steps.create-shot-images.parameters",
            "steps.create-shot-videos.parameters",
        ],
        "locked_fields": [
            "schema_id",
            "schema_version",
            "graph.connections",
            "security",
        ],
    },
    "result_policy": {
        "same_card": True,
        "image_batch_siblings": True,
        "ingest_provider_media": True,
    },
    "security": {
        "arbitrary_code": False,
        "auto_execute": False,
        "cross_project_lookup": False,
    },
}


def _derive_builtin(
    *,
    template_id: str,
    name: str,
    category: str,
    tags: list[str],
    description: str,
    primary_key: str,
    primary_label: str,
    reference_slot: str,
) -> dict:
    manifest = deepcopy(_PRODUCT_AD_MANIFEST)
    manifest["template_id"] = template_id
    manifest["metadata"] = {
        "name": name,
        "category": category,
        "tags": tags,
        "description": description,
    }
    manifest["variables"][0]["key"] = primary_key
    manifest["variables"][0]["label"] = primary_label
    manifest["asset_slots"][0]["slot_id"] = reference_slot
    for step in manifest["steps"]:
        step["input_bindings"] = [
            primary_key if value == "product_name" else
            reference_slot if value == "product_reference" else value
            for value in step["input_bindings"]
        ]
    manifest["override_policy"]["allowed_fields"] = [
        value.replace("product_name", primary_key)
        for value in manifest["override_policy"]["allowed_fields"]
    ]
    return manifest


_BUILTIN_PAYLOADS = (
    _PRODUCT_AD_MANIFEST,
    _derive_builtin(
        template_id="revid.knowledge-talking-head",
        name="知识口播短片",
        category="knowledge",
        tags=["knowledge", "talking-head"],
        description="从知识主题创建口播脚本、配图和视频卡片",
        primary_key="topic",
        primary_label="知识主题",
        reference_slot="speaker_reference",
    ),
    _derive_builtin(
        template_id="revid.multi-shot-narrative",
        name="多镜头剧情短片",
        category="narrative",
        tags=["story", "multi-shot"],
        description="从剧情 Brief 创建多镜头脚本、分镜图和视频卡片",
        primary_key="story_brief",
        primary_label="剧情 Brief",
        reference_slot="visual_reference",
    ),
)

BUILTIN_WORKFLOW_TEMPLATES = {
    manifest.template_id: manifest
    for manifest in (
        WorkflowTemplateManifest.model_validate(payload)
        for payload in _BUILTIN_PAYLOADS
    )
}


def list_builtin_workflow_templates() -> list[dict]:
    return [
        _serialize_builtin(manifest)
        for manifest in BUILTIN_WORKFLOW_TEMPLATES.values()
    ]


def get_builtin_workflow_template(
    template_id: str,
    version: int,
) -> dict | None:
    manifest = BUILTIN_WORKFLOW_TEMPLATES.get(template_id)
    if manifest is None or version != 1:
        return None
    return _serialize_builtin(manifest)


def is_builtin_workflow_template(template_id: str) -> bool:
    return template_id in BUILTIN_WORKFLOW_TEMPLATES or template_id.startswith(
        "revid."
    )


def _serialize_builtin(manifest: WorkflowTemplateManifest) -> dict:
    normalized = manifest.model_dump(mode="json", exclude_none=True)
    return {
        "template_id": manifest.template_id,
        "scope": "built_in",
        "version": 1,
        "lifecycle": "published",
        "fingerprint": workflow_template_fingerprint(manifest),
        "manifest": normalized,
        "published_at": _BUILTIN_PUBLISHED_AT,
    }
