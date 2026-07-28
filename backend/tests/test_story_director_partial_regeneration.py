from __future__ import annotations

from copy import deepcopy
import importlib
import unittest

from tests.test_story_director_contract import REVISION, production_document


class StoryDirectorPartialRegenerationTests(unittest.TestCase):
    def _skill_module(self):
        try:
            return importlib.import_module("core.story_director_skill")
        except ModuleNotFoundError as error:
            self.fail(f"T6-012 RED [core.story_director_skill-absent]: {error}")

    def test_whole_document_regeneration_preserves_locked_user_fields(self) -> None:
        merge_story_production = self._skill_module().merge_story_production
        from schemas.story_production import StoryProductionDocument

        current_payload = production_document()
        current_role = current_payload["assets"]["roles"][0]
        current_role["editable_fields"] = {"name": "user", "description": "user"}
        current_role["locked_fields"] = {"name": True}
        candidate_payload = deepcopy(current_payload)
        candidate_role = candidate_payload["assets"]["roles"][0]
        candidate_role["name"] = "Replacement name"
        candidate_role["description"] = "Updated unlocked description."

        merged = merge_story_production(
            current=StoryProductionDocument.model_validate(current_payload),
            candidate=StoryProductionDocument.model_validate(candidate_payload),
            target_id=None,
        )

        role = merged.assets.roles[0]
        self.assertEqual(current_role["name"], role.name)
        self.assertEqual(current_role["description"], role.description)
        self.assertEqual(2, role.generation_revision)

    def test_partial_regeneration_changes_only_the_requested_unlocked_target(self) -> None:
        merge_story_production = self._skill_module().merge_story_production
        from schemas.story_production import StoryProductionDocument

        current = StoryProductionDocument.model_validate(production_document())
        candidate_payload = production_document()
        candidate_payload["assets"]["roles"][0]["description"] = "Must not leak."
        candidate_payload["shots"][0]["visual_description"] = "Requested shot changed."
        candidate_payload["shots"][0]["video_prompt"] = "Requested prompt changed."
        candidate = StoryProductionDocument.model_validate(candidate_payload)

        merged = merge_story_production(current=current, candidate=candidate, target_id="shot-1")

        self.assertEqual(current.assets.roles[0].description, merged.assets.roles[0].description)
        self.assertEqual("Requested shot changed.", merged.shots[0].visual_description)
        self.assertEqual("Requested prompt changed.", merged.shots[0].video_prompt)
        self.assertEqual(2, merged.shots[0].generation_revision)

    def test_regeneration_rejects_source_drift_and_unresolved_partial_target(self) -> None:
        skill = self._skill_module()
        from schemas.story_production import StoryProductionDocument

        current = StoryProductionDocument.model_validate(production_document())
        drifted_payload = production_document()
        drifted_payload["source_revision"] = "c" * 64
        drifted = StoryProductionDocument.model_validate(drifted_payload)

        with self.assertRaises(skill.StoryDirectorSkillError):
            skill.merge_story_production(current=current, candidate=drifted, target_id=None)
        with self.assertRaises(skill.StoryDirectorSkillError):
            skill.merge_story_production(
                current=current,
                candidate=StoryProductionDocument.model_validate(production_document()),
                target_id="missing-target",
            )

    def test_only_accepted_take_updates_transient_continuity(self) -> None:
        reconcile_story_take = self._skill_module().reconcile_story_take
        from schemas.story_production import StoryProductionDocument

        current = StoryProductionDocument.model_validate(production_document())
        rejected = reconcile_story_take(
            current,
            decision="rejected",
            take_id="take-rejected",
            result_node_id="result-rejected",
            result_revision=REVISION,
            observed_end_state="Rejected state.",
        )
        self.assertEqual(current.continuity, rejected.continuity)

        accepted = reconcile_story_take(
            current,
            decision="accepted",
            take_id="take-accepted",
            result_node_id="result-accepted",
            result_revision=REVISION,
            observed_end_state="Accepted observed state.",
        )
        self.assertEqual("take-accepted", accepted.continuity.accepted_take_id)
        self.assertEqual("Accepted observed state.", accepted.continuity.observed_end_state)
        self.assertEqual(current.continuity.identity_locks, accepted.continuity.identity_locks)
        self.assertEqual(current.continuity.canonical_revision, accepted.continuity.canonical_revision)


if __name__ == "__main__":
    unittest.main()
