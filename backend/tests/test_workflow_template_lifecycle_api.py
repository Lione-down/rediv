from __future__ import annotations

import json
import sys
import unittest
from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
from pathlib import Path
from unittest.mock import patch
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import func, select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api.router import include_routers
from controllers.store import DatabaseStore, configure_store, store
from core.security import create_token
from models.base import get_session
from models.canvas_revision import CanvasRevision
from models.generation_task import GenerationTask
from models.quota import QuotaLedger
from models.template import Template
from models.workflow_template import (
    WorkflowTemplateDefinition,
    WorkflowTemplateSlot,
    WorkflowTemplateVersion,
)
from tests.mysql_test_database import MySQLTestDatabase


FIXTURE_PATH = (
    Path(__file__).resolve().parents[2]
    / "ai"
    / "requirements"
    / "contracts"
    / "fixtures"
    / "workflow-template"
    / "portable-manifest.json"
)
BUILTIN_TEMPLATE_IDS = {
    "revid.product-ad",
    "revid.knowledge-talking-head",
    "revid.multi-shot-narrative",
}


class WorkflowTemplateLifecycleApiTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase("revid_test_workflow_template_lifecycle_api")
        cls.mysql_database.start()
        cls.base_manifest = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))

    @classmethod
    def tearDownClass(cls) -> None:
        cls.mysql_database.stop()

    def setUp(self) -> None:
        configure_store(DatabaseStore())
        self.app = FastAPI()
        include_routers(self.app)
        self.client = TestClient(self.app)
        store.registration_settings["registration_mode"] = "open"
        suffix = f"{self._testMethodName}-{uuid4()}"
        self.user = self._register_user(f"workflow-owner-{suffix}")
        self.other_user = self._register_user(f"workflow-other-{suffix}")
        self.headers = self._auth_headers(self.user["id"])
        self.other_headers = self._auth_headers(self.other_user["id"])

    def tearDown(self) -> None:
        self.client.close()

    def test_create_list_get_are_owner_scoped_and_persist_normalized_slots(self) -> None:
        template_id = self._template_id("owner-scope")
        created = self._create_template(template_id)
        foreign_id = self._template_id("foreign")
        self._create_template(foreign_id, headers=self.other_headers)

        listed = self.client.get("/api/workflow-templates", headers=self.headers)
        exact = self.client.get(
            f"/api/workflow-templates/{template_id}/versions/1",
            headers=self.headers,
        )
        foreign = self.client.get(
            f"/api/workflow-templates/{foreign_id}/versions/1",
            headers=self.headers,
        )

        self.assertEqual(201, created.status_code, created.text)
        self.assertEqual(200, listed.status_code, listed.text)
        self.assertEqual(200, exact.status_code, exact.text)
        self.assertEqual(404, foreign.status_code, foreign.text)
        listed_ids = {item["template_id"] for item in listed.json()["items"]}
        self.assertIn(template_id, listed_ids)
        self.assertNotIn(foreign_id, listed_ids)
        self.assertTrue(BUILTIN_TEMPLATE_IDS.issubset(listed_ids))
        self.assertEqual("private", exact.json()["scope"])
        self.assertEqual("draft", exact.json()["lifecycle"])
        self.assertEqual(template_id, exact.json()["manifest"]["template_id"])
        self.assertNotIn("owner_user_id", json.dumps(exact.json()))

        with get_session() as session:
            definition = session.scalar(
                select(WorkflowTemplateDefinition).where(
                    WorkflowTemplateDefinition.template_key == template_id
                )
            )
            version = session.scalar(
                select(WorkflowTemplateVersion).where(
                    WorkflowTemplateVersion.definition_id == definition.id,
                    WorkflowTemplateVersion.version == 1,
                )
            )
            slots = list(
                session.scalars(
                    select(WorkflowTemplateSlot)
                    .where(WorkflowTemplateSlot.version_id == version.id)
                    .order_by(WorkflowTemplateSlot.position)
                ).all()
            )
        self.assertEqual(self.user["id"], definition.owner_user_id)
        self.assertEqual(4, len(slots))
        self.assertEqual(
            ["product_name", "shot_count", "aspect_ratio", "product_reference"],
            [slot.slot_key for slot in slots],
        )

    def test_builtins_are_exactly_three_readable_and_fail_closed_on_writes(self) -> None:
        listed = self.client.get("/api/workflow-templates", headers=self.headers)
        self.assertEqual(200, listed.status_code, listed.text)
        builtins = {
            item["template_id"]: item
            for item in listed.json()["items"]
            if item["scope"] == "built_in"
        }
        self.assertEqual(BUILTIN_TEMPLATE_IDS, set(builtins))

        for template_id in BUILTIN_TEMPLATE_IDS:
            exact = self.client.get(
                f"/api/workflow-templates/{template_id}/versions/1",
                headers=self.headers,
            )
            updated = self.client.patch(
                f"/api/workflow-templates/{template_id}/versions/1",
                json={"manifest": exact.json()["manifest"]},
                headers=self.headers,
            )
            drafted = self.client.post(
                f"/api/workflow-templates/{template_id}/versions",
                json={"source_version": 1},
                headers=self.headers,
            )
            published = self.client.post(
                f"/api/workflow-templates/{template_id}/versions/1/publish",
                headers=self.headers,
            )
            retired = self.client.post(
                f"/api/workflow-templates/{template_id}/versions/1/retire",
                headers=self.headers,
            )
            self.assertEqual(200, exact.status_code, exact.text)
            self.assertEqual("published", exact.json()["lifecycle"])
            self.assertEqual(403, updated.status_code, updated.text)
            self.assertEqual(403, drafted.status_code, drafted.text)
            self.assertEqual(403, published.status_code, published.text)
            self.assertEqual(403, retired.status_code, retired.text)

    def test_draft_update_rejects_unknown_or_server_owned_fields_without_partial_write(self) -> None:
        template_id = self._template_id("draft-update")
        created = self._create_template(template_id)
        original = created.json()
        updated_manifest = deepcopy(original["manifest"])
        updated_manifest["metadata"]["name"] = "Updated private template"
        updated_manifest["variables"][0]["label"] = "Updated product name"

        updated = self.client.patch(
            f"/api/workflow-templates/{template_id}/versions/1",
            json={"manifest": updated_manifest},
            headers=self.headers,
        )
        invalid_manifest = deepcopy(updated_manifest)
        invalid_manifest["provider_endpoint"] = "https://invalid.example.test"
        invalid = self.client.patch(
            f"/api/workflow-templates/{template_id}/versions/1",
            json={"manifest": invalid_manifest},
            headers=self.headers,
        )
        spoofed_scope = deepcopy(updated_manifest)
        spoofed_scope["scope"] = "built_in"
        spoofed = self.client.patch(
            f"/api/workflow-templates/{template_id}/versions/1",
            json={"manifest": spoofed_scope},
            headers=self.headers,
        )
        exact = self.client.get(
            f"/api/workflow-templates/{template_id}/versions/1",
            headers=self.headers,
        )

        self.assertEqual(200, updated.status_code, updated.text)
        self.assertNotEqual(original["fingerprint"], updated.json()["fingerprint"])
        self.assertEqual(422, invalid.status_code, invalid.text)
        self.assertEqual(422, spoofed.status_code, spoofed.text)
        self.assertNotIn("provider_endpoint", invalid.text)
        self.assertNotIn("https://invalid.example.test", invalid.text)
        self.assertEqual(updated.json()["fingerprint"], exact.json()["fingerprint"])
        self.assertEqual(updated_manifest, exact.json()["manifest"])
        with get_session() as session:
            definitions = session.scalar(
                select(func.count())
                .select_from(WorkflowTemplateDefinition)
                .where(WorkflowTemplateDefinition.template_key == template_id)
            )
            versions = session.scalar(
                select(func.count())
                .select_from(WorkflowTemplateVersion)
                .join(
                    WorkflowTemplateDefinition,
                    WorkflowTemplateDefinition.id
                    == WorkflowTemplateVersion.definition_id,
                )
                .where(WorkflowTemplateDefinition.template_key == template_id)
            )
        self.assertEqual(1, definitions)
        self.assertEqual(1, versions)

    def test_publish_is_immutable_and_new_draft_is_exact_monotonic_version(self) -> None:
        template_id = self._template_id("publish")
        created = self._create_template(template_id)
        published = self.client.post(
            f"/api/workflow-templates/{template_id}/versions/1/publish",
            headers=self.headers,
        )
        published_snapshot = deepcopy(published.json())
        immutable_manifest = deepcopy(published_snapshot["manifest"])
        immutable_manifest["metadata"]["description"] = "must not be accepted"

        update_published = self.client.patch(
            f"/api/workflow-templates/{template_id}/versions/1",
            json={"manifest": immutable_manifest},
            headers=self.headers,
        )
        republish = self.client.post(
            f"/api/workflow-templates/{template_id}/versions/1/publish",
            headers=self.headers,
        )
        next_draft = self.client.post(
            f"/api/workflow-templates/{template_id}/versions",
            json={"source_version": 1},
            headers=self.headers,
        )
        exact_v1 = self.client.get(
            f"/api/workflow-templates/{template_id}/versions/1",
            headers=self.headers,
        )

        self.assertEqual(201, created.status_code, created.text)
        self.assertEqual(200, published.status_code, published.text)
        self.assertEqual("published", published_snapshot["lifecycle"])
        self.assertIsNotNone(published_snapshot["published_at"])
        self.assertEqual(409, update_published.status_code, update_published.text)
        self.assertEqual(409, republish.status_code, republish.text)
        self.assertEqual(201, next_draft.status_code, next_draft.text)
        self.assertEqual(2, next_draft.json()["version"])
        self.assertEqual("draft", next_draft.json()["lifecycle"])
        self.assertEqual(template_id, next_draft.json()["manifest"]["template_id"])
        self.assertEqual(2, next_draft.json()["manifest"]["template_version"])
        self.assertEqual("draft", next_draft.json()["manifest"]["lifecycle"])
        self.assertEqual(published_snapshot, exact_v1.json())

    def test_retire_preserves_published_payload_fingerprint_and_exact_read(self) -> None:
        template_id = self._template_id("retire")
        self._create_template(template_id)
        published = self.client.post(
            f"/api/workflow-templates/{template_id}/versions/1/publish",
            headers=self.headers,
        )
        retired = self.client.post(
            f"/api/workflow-templates/{template_id}/versions/1/retire",
            headers=self.headers,
        )
        exact = self.client.get(
            f"/api/workflow-templates/{template_id}/versions/1",
            headers=self.headers,
        )
        retired_again = self.client.post(
            f"/api/workflow-templates/{template_id}/versions/1/retire",
            headers=self.headers,
        )

        self.assertEqual(200, retired.status_code, retired.text)
        self.assertEqual("retired", retired.json()["lifecycle"])
        self.assertEqual(published.json()["manifest"], retired.json()["manifest"])
        self.assertEqual(published.json()["fingerprint"], retired.json()["fingerprint"])
        self.assertEqual(retired.json(), exact.json())
        self.assertEqual(409, retired_again.status_code, retired_again.text)

    def test_concurrent_new_draft_requests_create_one_version_without_partial_rows(self) -> None:
        template_id = self._template_id("concurrent")
        self._create_template(template_id)
        self.client.post(
            f"/api/workflow-templates/{template_id}/versions/1/publish",
            headers=self.headers,
        )

        def create_next_draft() -> int:
            with TestClient(self.app) as client:
                response = client.post(
                    f"/api/workflow-templates/{template_id}/versions",
                    json={"source_version": 1},
                    headers=self.headers,
                )
                return response.status_code

        with ThreadPoolExecutor(max_workers=2) as executor:
            statuses = sorted(executor.map(lambda _index: create_next_draft(), range(2)))

        self.assertEqual([201, 409], statuses)
        with get_session() as session:
            definition = session.scalar(
                select(WorkflowTemplateDefinition).where(
                    WorkflowTemplateDefinition.template_key == template_id
                )
            )
            versions = list(
                session.scalars(
                    select(WorkflowTemplateVersion)
                    .where(WorkflowTemplateVersion.definition_id == definition.id)
                    .order_by(WorkflowTemplateVersion.version)
                ).all()
            )
            slot_counts = {
                version.version: session.scalar(
                    select(func.count())
                    .select_from(WorkflowTemplateSlot)
                    .where(WorkflowTemplateSlot.version_id == version.id)
                )
                for version in versions
            }
        self.assertEqual([1, 2], [version.version for version in versions])
        self.assertEqual({1: 4, 2: 4}, slot_counts)

    def test_lifecycle_has_zero_canvas_quota_job_or_legacy_template_mutation(self) -> None:
        before = self._unrelated_counts()
        template_id = self._template_id("side-effects")
        created = self._create_template(template_id)
        published = self.client.post(
            f"/api/workflow-templates/{template_id}/versions/1/publish",
            headers=self.headers,
        )
        retired = self.client.post(
            f"/api/workflow-templates/{template_id}/versions/1/retire",
            headers=self.headers,
        )

        self.assertEqual(201, created.status_code, created.text)
        self.assertEqual(200, published.status_code, published.text)
        self.assertEqual(200, retired.status_code, retired.text)
        self.assertEqual(before, self._unrelated_counts())
        serialized = json.dumps(
            [created.json(), published.json(), retired.json()],
            ensure_ascii=False,
        ).lower()
        for forbidden in (
            "owner_user_id",
            "created_by_user_id",
            "provider_endpoint",
            "authorization",
            "quota_ledger",
            "provider_task",
            "raw_response",
        ):
            self.assertNotIn(forbidden, serialized)

    def test_published_private_version_survives_backend_restart(self) -> None:
        template_id = self._template_id("restart")
        self._create_template(template_id)
        published = self.client.post(
            f"/api/workflow-templates/{template_id}/versions/1/publish",
            headers=self.headers,
        )
        self.assertEqual(200, published.status_code, published.text)

        self.client.close()
        restart = self.mysql_database.restart_runtime()
        self.assertTrue(restart["match"])
        self.assertEqual(restart["head"], restart["current"])
        from database import close_db
        from main import app as production_app
        from settings.config import settings

        close_db()
        try:
            with patch.object(
                settings,
                "jwt_secret",
                "unit-test-workflow-template-restart-secret-minimum-32",
            ):
                restarted_headers = self._auth_headers(self.user["id"])
                with TestClient(production_app) as restarted_client:
                    exact = restarted_client.get(
                        f"/api/workflow-templates/{template_id}/versions/1",
                        headers=restarted_headers,
                    )
            self.assertEqual(200, exact.status_code, exact.text)
            self.assertEqual(published.json(), exact.json())
        finally:
            self.mysql_database.restart_runtime()
            configure_store(DatabaseStore())
            self.app = FastAPI()
            include_routers(self.app)
            self.client = TestClient(self.app)

    def _create_template(
        self,
        template_id: str,
        *,
        headers: dict[str, str] | None = None,
    ):
        return self.client.post(
            "/api/workflow-templates",
            json={"manifest": self._private_manifest(template_id)},
            headers=headers or self.headers,
        )

    def _private_manifest(self, template_id: str) -> dict:
        manifest = deepcopy(self.base_manifest)
        manifest["template_id"] = template_id
        manifest["template_version"] = 1
        manifest["lifecycle"] = "draft"
        manifest["scope"] = "private"
        manifest["metadata"]["name"] = f"Private {template_id}"
        return manifest

    @staticmethod
    def _template_id(label: str) -> str:
        return f"user.{label}.{uuid4().hex}"

    def _register_user(self, openid: str) -> dict:
        response = self.client.post(
            "/auth/wechat/mock",
            json={
                "openid": openid,
                "nickname": f"user-{openid}",
                "avatar_url": "",
                "unionid": None,
                "invitation_code": None,
            },
        )
        self.assertEqual(200, response.status_code, response.text)
        return response.json()["user"]

    @staticmethod
    def _auth_headers(user_id: str) -> dict[str, str]:
        token = create_token({"sub": user_id, "role": "user"})
        return {"Authorization": f"Bearer {token}"}

    @staticmethod
    def _unrelated_counts() -> tuple[int, int, int, int]:
        with get_session() as session:
            return (
                session.scalar(select(func.count()).select_from(CanvasRevision)),
                session.scalar(select(func.count()).select_from(GenerationTask)),
                session.scalar(select(func.count()).select_from(QuotaLedger)),
                session.scalar(select(func.count()).select_from(Template)),
            )


if __name__ == "__main__":
    unittest.main()
