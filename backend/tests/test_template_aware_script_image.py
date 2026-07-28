from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi import HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import api.image_generate as image_generate_api
import api.text_generate as text_generate_api
from schemas.generation import ImageGenerateRequest, TextGenerateRequest


SCRIPT_NODE_ID = "11111111-1111-4111-8111-111111111111"
IMAGE_NODE_ID = "22222222-2222-4222-8222-222222222222"
PROJECT_ID = "33333333-3333-4333-8333-333333333333"
CANVAS_ID = "44444444-4444-4444-8444-444444444444"
INSTANCE_ID = "55555555-5555-4555-8555-555555555555"
INSTANCE_STEP_ID = "66666666-6666-4666-8666-666666666666"
SHOT_ID = "77777777-7777-4777-8777-777777777777"

STORY_LINEAGE = {
    "contract_version": 1,
    "template_id": "revid.product-ad",
    "template_version": 1,
    "instance_id": INSTANCE_ID,
    "instance_step_id": INSTANCE_STEP_ID,
    "step_id": "compile-story",
    "script_node_id": SCRIPT_NODE_ID,
}


def story_request(lineage: dict = STORY_LINEAGE) -> TextGenerateRequest:
    return TextGenerateRequest.model_validate(
        {
            "project_id": PROJECT_ID,
            "origin_canvas_id": CANVAS_ID,
            "canvas_node_id": SCRIPT_NODE_ID,
            "intent": "script_draft",
            "brief": "Create a confirmed storyboard.",
            "canvas_revision": 1,
            "story_director": {
                "contract_version": 1,
                "source_node_ids": [],
                "template_lineage": lineage,
            },
        }
    )


def script_node(lineage: dict = STORY_LINEAGE) -> dict:
    return {
        "id": SCRIPT_NODE_ID,
        "node_type": "script",
        "content": {
            "subtype": "script",
            "serialization_version": 1,
            "text": "A product reveal in a quiet studio.",
            "workflow_template_lineage": lineage,
        },
    }


class TemplateAwareScriptImageContractTestCase(unittest.TestCase):
    def test_story_context_requires_exact_canvas_template_lineage(self) -> None:
        request = story_request()
        source = script_node()
        document = {"nodes": [source], "connections": []}

        with patch.object(
            text_generate_api,
            "resolve_workflow_template_story_lineage",
            return_value=request.story_director.template_lineage,
        ) as resolve_lineage:
            context = text_generate_api._story_director_context(
                request,
                document,
                source,
                user_id="owner-1",
            )

        self.assertEqual(
            request.story_director.template_lineage,
            context["template_lineage"],
        )
        resolve_lineage.assert_called_once()

    def test_story_context_rejects_stale_canvas_lineage_before_resolution(self) -> None:
        request = story_request()
        source = script_node({**STORY_LINEAGE, "template_version": 2})
        document = {"nodes": [source], "connections": []}

        with patch.object(
            text_generate_api,
            "resolve_workflow_template_story_lineage",
        ) as resolve_lineage:
            with self.assertRaises(HTTPException) as raised:
                text_generate_api._story_director_context(
                    request,
                    document,
                    source,
                    user_id="owner-1",
                )

        self.assertEqual(409, raised.exception.status_code)
        self.assertEqual(
            "workflow_template_story_lineage_stale",
            raised.exception.detail["code"],
        )
        resolve_lineage.assert_not_called()

    def test_image_context_requires_exact_card_shot_lineage(self) -> None:
        lineage = {**STORY_LINEAGE, "shot_id": SHOT_ID}
        request = ImageGenerateRequest.model_validate(
            {
                "project_id": PROJECT_ID,
                "origin_canvas_id": CANVAS_ID,
                "canvas_node_id": IMAGE_NODE_ID,
                "prompt": "Create the selected shot.",
                "template_lineage": lineage,
            }
        )
        document = {
            "nodes": [
                {
                    "id": IMAGE_NODE_ID,
                    "content": {
                        "source_script_node_id": SCRIPT_NODE_ID,
                        "shot_id": SHOT_ID,
                        "template_lineage": lineage,
                    },
                }
            ]
        }

        with (
            patch.object(
                image_generate_api,
                "resolve_workflow_template_story_lineage",
                return_value=request.template_lineage,
            ),
            patch.object(
                image_generate_api.document_controller,
                "get_document",
                return_value=document,
            ),
        ):
            snapshot = image_generate_api._resolve_image_template_lineage(
                request,
                user_id="owner-1",
            )

        self.assertEqual(lineage, snapshot)

    def test_image_context_rejects_stale_card_before_provider(self) -> None:
        lineage = {**STORY_LINEAGE, "shot_id": SHOT_ID}
        request = ImageGenerateRequest.model_validate(
            {
                "project_id": PROJECT_ID,
                "origin_canvas_id": CANVAS_ID,
                "canvas_node_id": IMAGE_NODE_ID,
                "prompt": "Create the selected shot.",
                "template_lineage": lineage,
            }
        )
        document = {
            "nodes": [
                {
                    "id": IMAGE_NODE_ID,
                    "content": {
                        "source_script_node_id": SCRIPT_NODE_ID,
                        "shot_id": "88888888-8888-4888-8888-888888888888",
                        "template_lineage": lineage,
                    },
                }
            ]
        }

        with (
            patch.object(
                image_generate_api,
                "resolve_workflow_template_story_lineage",
                return_value=request.template_lineage,
            ),
            patch.object(
                image_generate_api.document_controller,
                "get_document",
                return_value=document,
            ),
        ):
            with self.assertRaises(HTTPException) as raised:
                image_generate_api._resolve_image_template_lineage(
                    request,
                    user_id="owner-1",
                )

        self.assertEqual(409, raised.exception.status_code)
        self.assertEqual(
            "workflow_template_image_lineage_stale",
            raised.exception.detail["code"],
        )


if __name__ == "__main__":
    unittest.main()
