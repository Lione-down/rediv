from __future__ import annotations

import sys
import unittest
from copy import deepcopy
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from controllers.canvases import _duplicate_node_content
from models.canvas_node import CanvasNode


def node(
    node_id: str,
    node_type: str,
    content: dict,
    *,
    parent_node_id: str | None = None,
    is_locked: bool = False,
) -> CanvasNode:
    return CanvasNode(
        id=node_id,
        project_id="project-a",
        canvas_id="canvas-a",
        node_type=node_type,
        content=content,
        position_x=0,
        position_y=0,
        width=340,
        height=220,
        z_index=0,
        parent_node_id=parent_node_id,
        is_locked=is_locked,
        is_collapsed=False,
        status="active",
    )


def shot_child(node_id: str, group_id: str, index: int, *, locked: bool = False, schema_version: int = 1) -> CanvasNode:
    return node(
        node_id,
        "generation",
        {
            "subtype": "image",
            "serialization_version": 1,
            "shot_schema_version": schema_version,
            "shot_id": f"shot-{index:02d}",
            "shot_index": index,
            "shot_title": f"镜头 {index:02d}",
        },
        parent_node_id=group_id,
        is_locked=locked,
    )


class ShotStoryboardDuplicationTestCase(unittest.TestCase):
    def test_cinematic_sequence_source_and_accepted_result_remap_without_mutating_history(self) -> None:
        content = {
            "subtype": "script", "serialization_version": 1, "text": "雨夜车站",
            "cinematic_sequence": {
                "contract_version": 1, "schema_id": "revid.cinematic-sequence",
                "sequence_id": "sequence-1", "source_script_node_id": "script-a",
                "source_revision": "a" * 64,
                "director_brief": {
                    "source_script_node_id": "script-a", "source_revision": "a" * 64,
                },
                "clips": [{
                    "clip_id": "clip-01", "state": "accepted", "accepted_result_node_id": "result-a",
                    "accepted_result_revision": "b" * 64,
                }],
            },
        }
        duplicated = _duplicate_node_content(
            node("script-a", "script", content), [],
            {"script-a": "script-copy", "result-a": "result-copy"},
        )

        sequence = duplicated["cinematic_sequence"]
        self.assertEqual("sequence-script-copy", sequence["sequence_id"])
        self.assertEqual("script-copy", sequence["source_script_node_id"])
        self.assertEqual("script-copy", sequence["director_brief"]["source_script_node_id"])
        self.assertEqual("result-copy", sequence["clips"][0]["accepted_result_node_id"])
        self.assertEqual("script-a", content["cinematic_sequence"]["source_script_node_id"])

    def test_cinematic_bindings_and_script_lineage_remap_to_duplicate_canvas_ids(self) -> None:
        content = {
            "subtype": "image", "serialization_version": 1,
            "source_script_node_id": "script-a", "source_revision": "a" * 64,
            "cinematic_skill": {
                "contract_version": 1, "enabled": True, "skill_id": "revid.cinema-image",
                "skill_version": 1, "provider_id": "agnes", "model_id": "agnes-image-2.1-flash",
                "mentions": [{
                    "node_id": "reference-a", "role": "identity", "instruction": "保持身份",
                    "source_revision": "b" * 64,
                }],
            },
        }
        duplicated = _duplicate_node_content(
            node("generation-a", "generation", content), [],
            {"generation-a": "generation-copy", "script-a": "script-copy", "reference-a": "reference-copy"},
        )
        self.assertEqual("script-copy", duplicated["source_script_node_id"])
        self.assertEqual("reference-copy", duplicated["cinematic_skill"]["mentions"][0]["node_id"])
        self.assertEqual("reference-a", content["cinematic_skill"]["mentions"][0]["node_id"])

    def test_cinematic_shot_schema_v2_remaps_ordered_children(self) -> None:
        group_id = "group-cinematic"
        content = {
            "subtype": "storyboard", "serialization_version": 1, "storyboard_schema_version": 2,
            "storyboard_kind": "shot-plan", "shot_schema_version": 2, "aspect_ratio": "16:9",
            "columns": 2, "show_numbers": True, "ordered_child_ids": ["generation-a", "generation-b"],
            "source_script_node_id": "script-a", "source_revision": "a" * 64,
        }
        duplicated = _duplicate_node_content(
            node(group_id, "group", content),
            [shot_child("generation-a", group_id, 1, schema_version=2), shot_child("generation-b", group_id, 2, schema_version=2)],
            {
                group_id: "group-copy", "generation-a": "generation-a-copy",
                "generation-b": "generation-b-copy", "script-a": "script-copy",
            },
        )
        self.assertEqual(2, duplicated["shot_schema_version"])
        self.assertEqual(["generation-a-copy", "generation-b-copy"], duplicated["ordered_child_ids"])
        self.assertEqual("script-copy", duplicated["source_script_node_id"])

    def test_exact_shot_plan_v2_remaps_ordered_children(self) -> None:
        group_id = "group-a"
        content = {
            "subtype": "storyboard",
            "serialization_version": 1,
            "storyboard_schema_version": 2,
            "storyboard_kind": "shot-plan",
            "shot_schema_version": 1,
            "aspect_ratio": "16:9",
            "columns": 2,
            "show_numbers": True,
            "ordered_child_ids": ["generation-b", "generation-a"],
            "title": "分镜计划",
        }
        group = node(group_id, "group", content)
        children = [shot_child("generation-a", group_id, 1), shot_child("generation-b", group_id, 2)]

        duplicated = _duplicate_node_content(
            group,
            children,
            {
                group_id: "group-copy",
                "generation-a": "generation-a-copy",
                "generation-b": "generation-b-copy",
            },
        )

        self.assertEqual(["generation-b-copy", "generation-a-copy"], duplicated["ordered_child_ids"])
        self.assertEqual(2, duplicated["storyboard_schema_version"])
        self.assertEqual("shot-plan", duplicated["storyboard_kind"])
        self.assertEqual(["generation-b", "generation-a"], content["ordered_child_ids"])

    def test_future_malformed_or_locked_shot_plan_is_preserved_without_remap(self) -> None:
        group_id = "group-a"
        base = {
            "subtype": "storyboard",
            "serialization_version": 1,
            "storyboard_schema_version": 2,
            "storyboard_kind": "shot-plan",
            "shot_schema_version": 1,
            "aspect_ratio": "16:9",
            "columns": 2,
            "show_numbers": True,
            "ordered_child_ids": ["generation-a", "generation-b"],
        }
        valid_children = [shot_child("generation-a", group_id, 1), shot_child("generation-b", group_id, 2)]
        future = {**base, "storyboard_schema_version": 3}
        malformed_children = [shot_child("generation-a", group_id, 2), shot_child("generation-b", group_id, 2)]
        locked_children = [shot_child("generation-a", group_id, 1, locked=True), valid_children[1]]

        cases = [
            (future, valid_children),
            (base, malformed_children),
            (base, locked_children),
        ]
        node_id_map = {
            group_id: "group-copy",
            "generation-a": "generation-a-copy",
            "generation-b": "generation-b-copy",
        }
        for content, children in cases:
            with self.subTest(content=content, children=children):
                snapshot = deepcopy(content)
                duplicated = _duplicate_node_content(node(group_id, "group", content), children, node_id_map)
                self.assertEqual(snapshot, duplicated)


if __name__ == "__main__":
    unittest.main()
