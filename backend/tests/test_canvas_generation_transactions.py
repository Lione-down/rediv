from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import patch
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import event, select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import main as backend_main
from api.router import include_routers
from controllers import generation_transactions as generation_controller
from controllers.store import DatabaseStore, configure_store, store
from core.security import create_token
from models.asset import Asset
from models.base import get_session
from models.generation_task import GenerationTask
from models.quota import Quota, QuotaLedger
from tests.mysql_test_database import MySQLTestDatabase


class _FakeImageProvider:
    def __init__(self, *, error: Exception | None = None) -> None:
        self.error = error
        self.calls: list[dict] = []

    async def generate_image(
        self,
        model: str,
        prompt: str,
        image: list[str] | None = None,
        **kwargs,
    ) -> dict:
        self.calls.append({"model": model, "prompt": prompt, "image": image, "kwargs": kwargs})
        if self.error is not None:
            raise self.error
        return {
            "id": "provider-image-request",
            "data": [{"url": "https://example.com/generated-image.png"}],
        }


class CanvasGenerationTransactionsTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase("revid_test_canvas_generation_transactions")
        cls.mysql_database.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.mysql_database.stop()

    def setUp(self) -> None:
        configure_store(DatabaseStore())
        self.client = self._new_client()
        store.registration_settings["registration_mode"] = "open"
        suffix = f"{self._testMethodName}-{uuid4()}"
        self.user = self._register_user(f"generation-owner-{suffix}")
        self.other_user = self._register_user(f"generation-other-{suffix}")
        self.headers = self._auth_headers(self.user["id"])
        self.project = store.create_project(self.user["id"], f"Generation Project {suffix}")
        self.canvas_id = store.get_first_canvas_id(self.project["id"])
        self.node = store.create_node(
            self.project["id"],
            self.user["id"],
            "generation",
            {"prompt": ""},
            100,
            200,
            320,
            180,
        )

    def tearDown(self) -> None:
        self.client.close()

    def test_image_success_persists_one_linked_transaction_and_authoritative_quota(self) -> None:
        provider = _FakeImageProvider()
        original_quota = self._database_quota("image")

        response = self._generate_image(provider)

        self.assertEqual(200, response.status_code)
        payload = response.json()
        self.assertEqual(original_quota - 1, payload["quotas"]["image"])
        self.assertEqual(payload["quotas"], dict(store.quotas[self.user["id"]]))
        with get_session() as session:
            task = session.scalar(
                select(GenerationTask).where(
                    GenerationTask.user_id == self.user["id"],
                    GenerationTask.media_type == "image",
                )
            )
            asset = session.scalar(
                select(Asset).where(Asset.user_id == self.user["id"], Asset.source == "generation")
            )
            ledger = session.scalar(
                select(QuotaLedger).where(
                    QuotaLedger.user_id == self.user["id"],
                    QuotaLedger.reason == "image_generate",
                )
            )

        self.assertIsNotNone(task)
        self.assertIsNotNone(asset)
        self.assertIsNotNone(ledger)
        self.assertEqual(self.project["id"], task.project_id)
        self.assertEqual(self.canvas_id, task.origin_canvas_id)
        self.assertEqual(self.node["id"], task.canvas_node_id)
        self.assertEqual(self.project["id"], asset.project_id)
        self.assertEqual(self.canvas_id, asset.origin_canvas_id)
        self.assertEqual(self.node["id"], asset.canvas_node_id)
        self.assertEqual(task.id, asset.source_task_id)
        self.assertEqual(asset.id, task.result_asset_id)
        self.assertEqual(task.id, ledger.related_task_id)
        self.assertEqual(-1, ledger.change_amount)
        self.assertEqual(original_quota - 1, self._database_quota("image"))
        self.assertEqual(
            {
                "contract_version": 1,
                "media_type": "image",
                "model": "agnes-image-2.1-flash",
                "size": "1K",
                "aspect_ratio": "4:3",
                "image_ids": [],
            },
            task.request_parameters,
        )
        self.assertEqual(task.request_parameters, payload["generation_task"]["request_parameters"])
        self.assertEqual(100, payload["generation_task"]["progress_percent"])
        self.assertEqual("persisting", payload["generation_task"]["progress_stage"])
        self.assertEqual({"size": "1K", "ratio": "4:3"}, provider.calls[0]["kwargs"])

        assets = self.client.get(
            "/assets",
            params={"project_id": self.project["id"]},
            headers=self.headers,
        )
        tasks = self.client.get(
            "/api/generation-tasks",
            params={"project_id": self.project["id"]},
            headers=self.headers,
        )
        self.assertEqual([asset.id], [item["id"] for item in assets.json()["items"]])
        self.assertEqual([task.id], [item["id"] for item in tasks.json()["items"]])

    def test_durable_progress_is_monotonic_and_success_reaches_100(self) -> None:
        task, _input_images = generation_controller.start_image_generation_task(
            user_id=self.user["id"],
            provider="agnes",
            model="agnes-image-2.1-flash",
            project_id=self.project["id"],
            origin_canvas_id=self.canvas_id,
            canvas_node_id=self.node["id"],
            image_ids=None,
            request_parameters={"contract_version": 1, "media_type": "image"},
        )
        self.assertIsNone(task["progress_percent"])
        self.assertEqual("queued", task["progress_stage"])

        first = generation_controller.update_generation_task_state(
            task["id"], status="running", progress_stage="provider", progress_percent=12,
        )
        self.assertEqual(12, first["progress_percent"])
        self.assertEqual("provider", first["progress_stage"])
        advanced = generation_controller.update_generation_task_state(task["id"], progress_percent=47)
        self.assertEqual(47, advanced["progress_percent"])
        self.assertEqual(
            47,
            generation_controller.update_generation_task_state(task["id"], progress_percent=30)["progress_percent"],
        )
        self.assertEqual(
            47,
            generation_controller.update_generation_task_state(task["id"], progress_percent=None)["progress_percent"],
        )
        with self.assertRaises(generation_controller.GenerationTaskStateError):
            generation_controller.update_generation_task_state(task["id"], progress_percent=True)
        with self.assertRaises(generation_controller.GenerationTaskStateError):
            generation_controller.update_generation_task_state(task["id"], progress_percent=101)

        generation_controller.update_generation_task_state(task["id"], progress_stage="persisting")
        result = generation_controller.complete_generation_task(
            task["id"],
            asset_type="image",
            url="https://example.com/progress-result.png",
            content_text=None,
            source_model="agnes-image-2.1-flash",
            duration_ms=100,
            provider_request_id="progress-provider-request",
        )
        self.assertEqual("succeeded", result["generation_task"]["status"])
        self.assertEqual(100, result["generation_task"]["progress_percent"])
        self.assertEqual("persisting", result["generation_task"]["progress_stage"])

    def test_failure_preserves_last_valid_progress_without_result_or_charge(self) -> None:
        original_quota = self._database_quota("image")
        task, _input_images = generation_controller.start_image_generation_task(
            user_id=self.user["id"],
            provider="agnes",
            model="agnes-image-2.1-flash",
            project_id=self.project["id"],
            origin_canvas_id=self.canvas_id,
            canvas_node_id=self.node["id"],
            image_ids=None,
            request_parameters={"contract_version": 1, "media_type": "image"},
        )
        generation_controller.update_generation_task_state(
            task["id"], status="running", progress_stage="provider", progress_percent=47,
        )

        failed = generation_controller.fail_generation_task(
            task["id"],
            status="timed_out",
            duration_ms=500,
            provider_request_id="progress-timeout",
            error_code="timeout",
            error_message="Provider timed out",
        )

        self.assertEqual("timed_out", failed["status"])
        self.assertEqual(47, failed["progress_percent"])
        self.assertEqual("provider", failed["progress_stage"])
        self.assertIsNone(failed["result_asset_id"])
        self.assertEqual(original_quota, self._database_quota("image"))
        with get_session() as session:
            self.assertEqual([], self._generation_ledger(session))

    def test_provider_failure_records_scoped_task_without_asset_charge_or_refund(self) -> None:
        provider = _FakeImageProvider(error=RuntimeError("provider unavailable"))
        original_quota = self._database_quota("image")

        response = self._generate_image(provider)

        self.assertEqual(500, response.status_code)
        with get_session() as session:
            tasks = list(
                session.scalars(
                    select(GenerationTask).where(GenerationTask.user_id == self.user["id"])
                ).all()
            )
            assets = list(
                session.scalars(
                    select(Asset).where(
                        Asset.user_id == self.user["id"],
                        Asset.source == "generation",
                    )
                ).all()
            )
            ledger = self._generation_ledger(session)

        self.assertEqual(1, len(tasks))
        self.assertEqual("failed", tasks[0].status)
        self.assertEqual("provider_error", tasks[0].error_code)
        self.assertEqual("provider", tasks[0].progress_stage)
        self.assertIsNone(tasks[0].progress_percent)
        self.assertEqual(self.project["id"], tasks[0].project_id)
        self.assertEqual(self.canvas_id, tasks[0].origin_canvas_id)
        self.assertEqual([], assets)
        self.assertEqual([], ledger)
        self.assertEqual(original_quota, self._database_quota("image"))

    def test_asset_failure_rolls_back_success_work_without_charge_or_refund(self) -> None:
        provider = _FakeImageProvider()
        original_quota = self._database_quota("image")

        def fail_generated_asset(_mapper, _connection, target: Asset) -> None:
            if target.source == "generation":
                raise RuntimeError("forced asset persistence failure")

        event.listen(Asset, "before_insert", fail_generated_asset)
        try:
            response = self._generate_image(provider)
        finally:
            event.remove(Asset, "before_insert", fail_generated_asset)

        self.assertEqual(500, response.status_code)
        self.assertEqual("Failed to save generated asset", response.json()["detail"])
        with get_session() as session:
            task = session.scalar(
                select(GenerationTask).where(GenerationTask.user_id == self.user["id"])
            )
            assets = list(
                session.scalars(
                    select(Asset).where(
                        Asset.user_id == self.user["id"],
                        Asset.source == "generation",
                    )
                ).all()
            )
            ledger = self._generation_ledger(session)

        self.assertEqual("failed", task.status)
        self.assertEqual("asset_persistence_error", task.error_code)
        self.assertEqual("persisting", task.progress_stage)
        self.assertIsNone(task.progress_percent)
        self.assertIsNone(task.result_asset_id)
        self.assertEqual([], assets)
        self.assertEqual([], ledger)
        self.assertEqual(original_quota, self._database_quota("image"))

    def test_foreign_scope_is_rejected_before_provider_or_task_creation(self) -> None:
        foreign_project = store.create_project(self.other_user["id"], "Foreign Generation")
        foreign_canvas_id = store.get_first_canvas_id(foreign_project["id"])
        provider = _FakeImageProvider()

        response = self._generate_image(
            provider,
            project_id=foreign_project["id"],
            origin_canvas_id=foreign_canvas_id,
            canvas_node_id=None,
        )

        self.assertEqual(403, response.status_code)
        self.assertEqual([], provider.calls)
        self.assertEqual(0, self._task_count())

    def test_missing_mismatched_canvas_and_foreign_node_are_rejected_before_provider(self) -> None:
        other_project = store.create_project(self.user["id"], "Other Canvas Scope")
        other_canvas_id = store.get_first_canvas_id(other_project["id"])
        foreign_project = store.create_project(self.other_user["id"], "Foreign Node Scope")
        foreign_node = store.create_node(
            foreign_project["id"],
            self.other_user["id"],
            "generation",
            {},
            0,
            0,
            320,
            180,
        )
        cases = [
            (str(uuid4()), None, 404),
            (other_canvas_id, None, 403),
            (self.canvas_id, foreign_node["id"], 403),
        ]

        for origin_canvas_id, canvas_node_id, expected_status in cases:
            with self.subTest(expected_status=expected_status, canvas_node_id=canvas_node_id):
                provider = _FakeImageProvider()
                response = self._generate_image(
                    provider,
                    origin_canvas_id=origin_canvas_id,
                    canvas_node_id=canvas_node_id,
                )
                self.assertEqual(expected_status, response.status_code)
                self.assertEqual([], provider.calls)
        self.assertEqual(0, self._task_count())

    def test_same_user_cross_project_input_asset_is_rejected_before_provider(self) -> None:
        other_project = store.create_project(self.user["id"], "Other Generation Project")
        other_canvas_id = store.get_first_canvas_id(other_project["id"])
        input_asset = store.create_asset(
            self.user["id"],
            "image",
            "https://example.com/other-project.png",
            None,
            project_id=other_project["id"],
            origin_canvas_id=other_canvas_id,
        )
        provider = _FakeImageProvider()

        response = self._generate_image(provider, image_ids=[input_asset["id"]])

        self.assertEqual(403, response.status_code)
        self.assertEqual([], provider.calls)
        self.assertEqual(0, self._task_count())

    def test_database_quota_overrides_stale_process_cache(self) -> None:
        provider = _FakeImageProvider()
        with get_session() as session:
            quota = session.scalar(select(Quota).where(Quota.user_id == self.user["id"]))
            quota.image_quota = 2
            session.commit()
        self.assertNotEqual(2, store.quotas[self.user["id"]]["image"])

        response = self._generate_image(provider)

        self.assertEqual(200, response.status_code)
        self.assertEqual(1, response.json()["quotas"]["image"])
        self.assertEqual(1, self._database_quota("image"))
        self.assertEqual(1, store.quotas[self.user["id"]]["image"])

    def test_frozen_generation_status_blocks_provider_and_task(self) -> None:
        user = store.get_user(self.user["id"])
        user["generation_status"] = "frozen"
        provider = _FakeImageProvider()

        response = self._generate_image(provider)

        self.assertEqual(403, response.status_code)
        self.assertEqual("Generation is frozen", response.json()["detail"])
        self.assertEqual([], provider.calls)
        self.assertEqual(0, self._task_count())

    def test_generation_history_filters_validate_foreign_project_scope(self) -> None:
        foreign_project = store.create_project(self.other_user["id"], "Foreign History")

        response = self.client.get(
            "/api/generation-tasks",
            params={"project_id": foreign_project["id"]},
            headers=self.headers,
        )

        self.assertEqual(403, response.status_code)

    def _generate_image(
        self,
        provider: _FakeImageProvider,
        *,
        project_id: str | None = None,
        origin_canvas_id: str | None = None,
        canvas_node_id: str | None | object = ...,
        image_ids: list[str] | None = None,
    ):
        if canvas_node_id is ...:
            canvas_node_id = self.node["id"]
        payload = {
            "project_id": project_id or self.project["id"],
            "origin_canvas_id": origin_canvas_id or self.canvas_id,
            "canvas_node_id": canvas_node_id,
            "prompt": "Create a project-scoped image",
        }
        if image_ids is not None:
            payload["image_ids"] = image_ids
        with patch.object(backend_main, "_agnes", provider):
            return self.client.post(
                "/api/image-generate",
                json=payload,
                headers=self.headers,
            )

    def _database_quota(self, quota_type: str) -> int:
        with get_session() as session:
            quota = session.scalar(select(Quota).where(Quota.user_id == self.user["id"]))
            return getattr(quota, f"{quota_type}_quota")

    def _task_count(self) -> int:
        with get_session() as session:
            return len(
                list(
                    session.scalars(
                        select(GenerationTask).where(GenerationTask.user_id == self.user["id"])
                    ).all()
                )
            )

    def _generation_ledger(self, session) -> list[QuotaLedger]:
        return list(
            session.scalars(
                select(QuotaLedger).where(
                    QuotaLedger.user_id == self.user["id"],
                    QuotaLedger.reason.in_(["image_generate", "image_generate_refund"]),
                )
            ).all()
        )

    @staticmethod
    def _new_client() -> TestClient:
        app = FastAPI()
        include_routers(app)
        return TestClient(app)

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
        self.assertEqual(200, response.status_code)
        return response.json()["user"]

    @staticmethod
    def _auth_headers(user_id: str) -> dict[str, str]:
        token = create_token({"sub": user_id, "role": "user"})
        return {"Authorization": f"Bearer {token}"}


if __name__ == "__main__":
    unittest.main()
