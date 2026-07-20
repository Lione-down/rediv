from __future__ import annotations

import unittest

from core.cinematic_director_contract import (
    CinematicDirectorContractError,
    parse_cinematic_director_brief,
    parse_cinematic_reference_transfer,
    parse_cinematic_retake_context,
)


REVISION = "a" * 64


def director_brief() -> dict:
    return {
        "contract_version": 1,
        "schema_id": "revid.cinematic-director-brief",
        "source_script_node_id": "script-1",
        "source_revision": REVISION,
        "intention": "让角色在迟疑后做出决定",
        "visible_beat": "角色抬头并迈入雨中",
        "camera": {"shot": "中景", "movement": "缓慢推进", "endpoint": "停在面部近景"},
        "light": {"motivated_source": "街灯", "transition": "由冷转暖"},
        "blocking_performance": "先停顿，再迈步",
        "motion": "雨线稳定，衣摆随动作延迟",
        "sound_intent": "保留雨声和一次呼吸",
        "continuity_anchors": ["深灰风衣", "左手提包"],
        "must_preserve": ["角色身份"],
        "allowed_changes": ["镜头距离"],
        "must_not_transfer": ["参考图背景"],
        "safety_notes": [],
    }


class CinematicDirectorContractTests(unittest.TestCase):
    def test_director_brief_and_reference_transfer_are_strict_and_normalized(self):
        parsed = parse_cinematic_director_brief(director_brief())
        self.assertEqual("让角色在迟疑后做出决定", parsed["intention"])
        self.assertEqual(REVISION, parsed["source_revision"])

        reference = parse_cinematic_reference_transfer({
            "contract_version": 1,
            "node_id": "image-1",
            "role": "identity",
            "instruction": "保留角色面部与发型",
            "must_not_transfer": ["logo", "background", "camera"],
            "source_revision": REVISION,
        })
        self.assertEqual(["logo", "background", "camera"], reference["must_not_transfer"])

        for invalid in [
            {**director_brief(), "extra": True},
            {**director_brief(), "source_revision": "stale"},
            {**director_brief(), "intention": "x" * 501},
            {**director_brief(), "continuity_anchors": [str(index) for index in range(13)]},
        ]:
            with self.assertRaises(CinematicDirectorContractError):
                parse_cinematic_director_brief(invalid)

        with self.assertRaises(CinematicDirectorContractError):
            parse_cinematic_reference_transfer({
                "contract_version": 1, "node_id": "image-1", "role": "identity",
                "instruction": "保留角色", "must_not_transfer": ["provider_field"],
                "source_revision": REVISION,
            })

    def test_retake_requires_one_explicit_repair_variable_without_execution_fields(self):
        parsed = parse_cinematic_retake_context({
            "contract_version": 1,
            "prior_task_id": "task-1",
            "prior_result_node_id": "result-1",
            "decision": "reroll",
            "problem_category": "camera",
            "repair_variable": "camera_movement",
            "attempt_count": 2,
            "revised_instruction": None,
        })
        self.assertEqual("camera_movement", parsed["repair_variable"])

        invalid = {
            "contract_version": 1,
            "prior_task_id": "task-1",
            "prior_result_node_id": "result-1",
            "decision": "reroll",
            "problem_category": "camera",
            "repair_variable": None,
            "attempt_count": 1,
            "revised_instruction": None,
        }
        with self.assertRaises(CinematicDirectorContractError):
            parse_cinematic_retake_context(invalid)
        with self.assertRaises(CinematicDirectorContractError):
            parse_cinematic_retake_context({**invalid, "execute": True})


if __name__ == "__main__":
    unittest.main()
