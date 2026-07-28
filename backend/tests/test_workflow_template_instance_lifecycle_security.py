from __future__ import annotations

import sys
import unittest
from pathlib import Path
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from models.base import get_session, utc_now
from models.workflow_run import WorkflowRun

from tests.workflow_template_instance_lifecycle_support import (
    WorkflowTemplateInstanceLifecycleSupport,
)


class WorkflowTemplateInstanceLifecycleSecurityTestCase(
    WorkflowTemplateInstanceLifecycleSupport
):
    def test_invalid_stale_changed_and_foreign_requests_leave_zero_write(self) -> None:
        instance, _captured = self._instance_with_v2()
        diff = self.client.post(
            self._instance_path(instance["instance_id"], "version-diff"),
            json={"target_version": 2},
            headers=self.headers,
        )
        self.assertEqual(200, diff.status_code, diff.text)
        before = self._side_effect_counts()
        common = {
            "target_version": 2,
            "base_revision": self._current_revision(),
            "client_mutation_id": f"upgrade-{uuid4()}",
            "diff_fingerprint": diff.json()["fingerprint"],
        }

        malformed = self.client.post(
            self._instance_path(instance["instance_id"], "upgrade"),
            json={**common, "target_version": "2"},
            headers=self.headers,
        )
        stale = self.client.post(
            self._instance_path(instance["instance_id"], "upgrade"),
            json={**common, "base_revision": common["base_revision"] + 1},
            headers=self.headers,
        )
        changed = self.client.post(
            self._instance_path(instance["instance_id"], "upgrade"),
            json={**common, "diff_fingerprint": "0" * 64},
            headers=self.headers,
        )
        foreign = self.client.post(
            self._instance_path(instance["instance_id"], "version-diff"),
            json={"target_version": 2},
            headers=self.other_headers,
        )
        foreign_state = self.client.get(
            self._instance_path(
                instance["instance_id"],
                "version-diff",
            ).removesuffix("/version-diff"),
            headers=self.other_headers,
        )

        self.assertEqual(422, malformed.status_code, malformed.text)
        self.assertEqual(409, stale.status_code, stale.text)
        self.assertEqual("stale_graph_revision", stale.json()["detail"]["code"])
        self.assertEqual(409, changed.status_code, changed.text)
        self.assertEqual(
            "workflow_template_version_diff_stale",
            changed.json()["detail"]["code"],
        )
        self.assertEqual(404, foreign.status_code, foreign.text)
        self.assertEqual(404, foreign_state.status_code, foreign_state.text)
        self.assertNotIn(instance["instance_id"], foreign.text)
        self.assertEqual(before, self._side_effect_counts())

    def test_retired_target_and_active_run_block_lifecycle_writes(self) -> None:
        instance, captured = self._instance_with_v2()
        retired = self.client.post(
            (
                f"/api/workflow-templates/{captured['manifest']['template_id']}"
                "/versions/2/retire"
            ),
            headers=self.headers,
        )
        self.assertEqual(200, retired.status_code, retired.text)
        before_retired = self._side_effect_counts()
        unavailable = self.client.post(
            self._instance_path(instance["instance_id"], "version-diff"),
            json={"target_version": 2},
            headers=self.headers,
        )
        self.assertEqual(409, unavailable.status_code, unavailable.text)
        self.assertEqual(
            "workflow_template_version_unavailable",
            unavailable.json()["detail"]["code"],
        )
        self.assertEqual(before_retired, self._side_effect_counts())

        now = utc_now()
        with get_session() as session:
            session.add(
                WorkflowRun(
                    id=str(uuid4()),
                    instance_id=instance["instance_id"],
                    owner_user_id=self.user["id"],
                    project_id=self.project["id"],
                    canvas_id=self.canvas_id,
                    status="ready",
                    preflight_fingerprint="b" * 64,
                    client_run_id=f"run-{uuid4()}",
                    cost_confirmed=True,
                    quota_estimate={"text": 0, "image": 0, "video": 0},
                    cost_class="standard",
                    created_at=now,
                    updated_at=now,
                    completed_at=None,
                )
            )
            session.commit()
        before_run_block = self._side_effect_counts()
        blocked = self.client.post(
            self._instance_path(instance["instance_id"], "detach"),
            json={
                "base_revision": self._current_revision(),
                "client_mutation_id": f"detach-{uuid4()}",
            },
            headers=self.headers,
        )
        self.assertEqual(409, blocked.status_code, blocked.text)
        self.assertEqual(
            "workflow_template_instance_run_active",
            blocked.json()["detail"]["code"],
        )
        self.assertEqual(before_run_block, self._side_effect_counts())


if __name__ == "__main__":
    unittest.main()
