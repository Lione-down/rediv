from __future__ import annotations

import sys
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from unittest.mock import patch
from uuid import uuid4

from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from models.base import get_session
from models.canvas_revision import CanvasRevision
from schemas.workflow_template_instance import WorkflowTemplateInstantiateRequest
from tests.workflow_template_instantiation_support import (
    WorkflowTemplateInstantiationSupport,
)


class WorkflowTemplateIdempotencyTestCase(
    WorkflowTemplateInstantiationSupport
):
    def test_identical_replay_returns_same_ids_without_duplicate_rows(self) -> None:
        _, _, _, request = self._published_preflight()

        first = self._instantiate(request)
        self.assertEqual(201, first.status_code, first.text)
        after_first = self._side_effect_counts()
        replay = self._instantiate(request)

        self.assertEqual(200, replay.status_code, replay.text)
        self.assertEqual(first.json(), replay.json())
        self.assertEqual(after_first, self._side_effect_counts())

    def test_mutation_key_reuse_with_changed_request_conflicts_without_write(self) -> None:
        _, _, _, request = self._published_preflight()
        first = self._instantiate(request)
        self.assertEqual(201, first.status_code, first.text)
        after_first = self._side_effect_counts()

        conflict = self._instantiate(
            {
                **request,
                "base_revision": first.json()["mutation"]["revision"],
                "anchor": {"x": 9_000, "y": 9_000},
            }
        )

        self.assertEqual(409, conflict.status_code, conflict.text)
        self.assertEqual("mutation_id_reused", conflict.json()["detail"]["code"])
        self.assertEqual(after_first, self._side_effect_counts())

    def test_lineage_failure_after_canvas_patch_rolls_back_everything(self) -> None:
        _, _, _, request = self._published_preflight()
        before = self._side_effect_counts()

        with patch(
            "controllers.workflow_template_instances.persist_instance_lineage",
            side_effect=RuntimeError("forced-lineage-failure"),
        ):
            with self.assertRaisesRegex(RuntimeError, "forced-lineage-failure"):
                self._instantiate(request)

        self.assertEqual(before, self._side_effect_counts())
        with get_session() as session:
            self.assertIsNone(
                session.scalar(
                    select(CanvasRevision).where(
                        CanvasRevision.canvas_id == self.canvas_id,
                        CanvasRevision.client_mutation_id
                        == request["client_mutation_id"],
                    )
                )
            )

    def test_concurrent_identical_request_serializes_to_one_revision(self) -> None:
        _, _, _, request = self._published_preflight()
        typed_request = WorkflowTemplateInstantiateRequest.model_validate(request)
        from controllers.workflow_template_instances import (
            instantiate_workflow_template,
        )

        def submit() -> dict:
            return instantiate_workflow_template(
                project_id=self.project["id"],
                canvas_id=self.canvas_id,
                owner_user_id=self.user["id"],
                request=typed_request,
            )

        before = self._side_effect_counts()
        with ThreadPoolExecutor(max_workers=2) as executor:
            results = list(executor.map(lambda _: submit(), range(2)))

        for result in results:
            result.pop("_is_replay", None)
        self.assertEqual(results[0], results[1])
        after = self._side_effect_counts()
        self.assertEqual(before[0] + 1, after[0])
        self.assertEqual(before[1] + 1, after[1])
        self.assertEqual(before[2] + 2, after[2])
        self.assertEqual(before[3] + 1, after[3])
        self.assertEqual(before[4] + 1, after[4])
        self.assertEqual(before[5:], after[5:])

    def test_replay_survives_canvas_revision_pruning(self) -> None:
        _, _, _, request = self._published_preflight()
        first = self._instantiate(request)
        self.assertEqual(201, first.status_code, first.text)
        with get_session() as session:
            revision = session.scalar(
                select(CanvasRevision).where(
                    CanvasRevision.canvas_id == self.canvas_id,
                    CanvasRevision.client_mutation_id == request["client_mutation_id"],
                )
            )
            session.delete(revision)
            session.commit()
        restart = self.mysql_database.restart_runtime()
        self.assertTrue(restart["match"])
        self.assertEqual("e0f1a2b3c4d5", restart["current"])
        after_prune = self._side_effect_counts()

        replay = self._instantiate(request)

        self.assertEqual(200, replay.status_code, replay.text)
        self.assertEqual(first.json(), replay.json())
        self.assertEqual(after_prune, self._side_effect_counts())


if __name__ == "__main__":
    unittest.main()
