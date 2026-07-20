from __future__ import annotations

import unittest

from core.cinematic_sequence_contract import (
    CinematicSequenceContractError,
    parse_cinematic_sequence_state,
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


def sequence_state() -> dict:
    return {
        "contract_version": 1,
        "schema_id": "revid.cinematic-sequence",
        "sequence_id": "sequence-1",
        "source_script_node_id": "script-1",
        "source_revision": REVISION,
        "story_objective": "角色决定离开熟悉的城市",
        "final_outcome": "角色登上清晨列车",
        "director_brief": director_brief(),
        "ordered_beats": [
            {"beat_id": "beat-01", "summary": "收到车票", "state": "completed"},
            {"beat_id": "beat-02", "summary": "走入雨中", "state": "planned"},
            {"beat_id": "beat-03", "summary": "登上列车", "state": "reserved"},
        ],
        "clips": [{
            "clip_id": "clip-01",
            "scene_id": "scene-01",
            "narrative_job": "让离开的决定可见",
            "intention": "从迟疑转为行动",
            "state": "accepted",
            "accepted_result_node_id": "result-1",
            "accepted_result_revision": REVISION,
            "observed_end_state": "角色站在雨中的站台入口",
            "completed_beat_ids": ["beat-01"],
            "reserved_beat_ids": ["beat-03"],
            "extension_depth": 1,
            "attempt_count": 1,
        }],
        "canon_revision": 1,
    }


class CinematicSequenceContractTests(unittest.TestCase):
    def test_sequence_accepts_ordered_unique_beats_and_explicit_accepted_canon(self):
        parsed = parse_cinematic_sequence_state(sequence_state())
        self.assertEqual("accepted", parsed["clips"][0]["state"])
        self.assertEqual(1, parsed["canon_revision"])

    def test_sequence_rejects_extra_keys_duplicate_ids_invalid_refs_and_partial_canon(self):
        duplicate = sequence_state()
        duplicate["ordered_beats"][1]["beat_id"] = "beat-01"
        unknown = sequence_state()
        unknown["clips"][0]["completed_beat_ids"] = ["beat-99"]
        partial = sequence_state()
        partial["clips"][0]["observed_end_state"] = None
        wrong_beat_state = sequence_state()
        wrong_beat_state["ordered_beats"][0]["state"] = "planned"
        too_many = sequence_state()
        too_many["clips"] = [
            {**too_many["clips"][0], "clip_id": f"clip-{index:02d}"}
            for index in range(1, 27)
        ]
        for invalid in [
            {**sequence_state(), "extra": True}, duplicate, unknown, partial, wrong_beat_state, too_many,
        ]:
            with self.assertRaises(CinematicSequenceContractError):
                parse_cinematic_sequence_state(invalid)


if __name__ == "__main__":
    unittest.main()
