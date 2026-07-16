from __future__ import annotations

import sys
import unittest
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from pathlib import Path
from threading import Event, current_thread
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import event, select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api.router import include_routers
from controllers import canvas_documents as canvas_document_controller
from controllers import canvases as canvas_controller
from controllers import generation_transactions as generation_controller
from controllers.store import DatabaseStore, configure_store, store
from core.security import create_token
from models.asset import Asset
from models.base import get_session, init_engine, utc_now
from models.canvas import Canvas
from models.generation_task import GenerationTask
from models.quota import Quota, QuotaLedger
from tests.mysql_test_database import MySQLTestDatabase


class GenerationTransactionConcurrencyTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase("revid_test_generation_transaction_concurrency")
        cls.mysql_database.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.mysql_database.stop()

    def setUp(self) -> None:
        configure_store(DatabaseStore())
        self.client = self._new_client()
        store.registration_settings["registration_mode"] = "open"
        suffix = f"{self._testMethodName}-{uuid4()}"
        self.user = self._register_user(f"generation-concurrency-{suffix}")
        self.headers = self._auth_headers(self.user["id"])
        self.project = store.create_project(self.user["id"], f"Concurrency {suffix}")
        self.canvas_id = store.get_first_canvas_id(self.project["id"])
        self.node = store.create_node(
            self.project["id"], self.user["id"], "generation", {}, 0, 0, 320, 180
        )

    def tearDown(self) -> None:
        self.client.close()

    def test_one_running_task_can_only_be_completed_once_and_terminal_state_is_stable(self) -> None:
        task = self._start_task()
        original_quota = self._database_quota()

        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = [executor.submit(self._complete_task, task["id"]) for _ in range(2)]
            outcomes = []
            errors = []
            for future in futures:
                try:
                    outcomes.append(future.result())
                except Exception as error:
                    errors.append(error)

        self.assertEqual(2, len(outcomes))
        self.assertEqual([], errors)
        self.assertEqual(1, len({outcome["asset"]["id"] for outcome in outcomes}))
        self.assertEqual(1, len({outcome["quota_revision"] for outcome in outcomes}))
        self.assertEqual(1, len({outcome["quotas"]["image"] for outcome in outcomes}))
        generation_controller.fail_generation_task(
            task["id"],
            status="failed",
            duration_ms=2,
            provider_request_id="late-failure",
            error_code="provider_error",
            error_message="late failure must not overwrite success",
        )

        with get_session() as session:
            persisted_task = session.get(GenerationTask, task["id"])
            assets = list(
                session.scalars(select(Asset).where(Asset.source_task_id == task["id"])).all()
            )
            ledger = list(
                session.scalars(
                    select(QuotaLedger).where(QuotaLedger.related_task_id == task["id"])
                ).all()
            )

        self.assertEqual("succeeded", persisted_task.status)
        self.assertEqual(assets[0].id, persisted_task.result_asset_id)
        self.assertEqual(1, len(assets))
        self.assertEqual(1, len(ledger))
        self.assertEqual(original_quota - 1, self._database_quota())

    def test_concurrent_tasks_return_monotonic_quota_revisions(self) -> None:
        self._set_database_quota(2)
        tasks = [self._start_task(), self._start_task()]

        with ThreadPoolExecutor(max_workers=2) as executor:
            outcomes = list(
                executor.map(lambda task: self._complete_task(task["id"]), tasks)
            )

        snapshots = sorted(
            (outcome["quota_revision"], outcome["quotas"]["image"])
            for outcome in outcomes
        )
        self.assertEqual(snapshots[0][0] + 1, snapshots[1][0])
        self.assertEqual([1, 0], [snapshot[1] for snapshot in snapshots])
        self.assertEqual(0, self._database_quota())
        with get_session() as session:
            assets = list(
                session.scalars(
                    select(Asset).where(Asset.source_task_id.in_([task["id"] for task in tasks]))
                ).all()
            )
            ledger = list(
                session.scalars(
                    select(QuotaLedger).where(
                        QuotaLedger.related_task_id.in_([task["id"] for task in tasks])
                    )
                ).all()
            )
        self.assertEqual(2, len(assets))
        self.assertEqual(2, len(ledger))

    def test_last_available_quota_reserves_exactly_one_provider_slot(self) -> None:
        self._set_database_quota(1)

        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = [executor.submit(self._start_task) for _ in range(2)]
            outcomes = []
            errors = []
            for future in futures:
                try:
                    outcomes.append(future.result())
                except Exception as error:
                    errors.append(error)

        self.assertEqual(1, len(outcomes))
        self.assertEqual(1, len(errors))
        with get_session() as session:
            running = list(
                session.scalars(
                    select(GenerationTask).where(
                        GenerationTask.user_id == self.user["id"],
                        GenerationTask.media_type == "image",
                        GenerationTask.status == "running",
                    )
                ).all()
            )
        self.assertEqual(1, len(running))
        self.assertEqual(1, self._database_quota())

    def test_stale_reservation_is_reconciled_on_restart_and_releases_quota(self) -> None:
        self._set_database_quota(1)
        stale_task = self._start_task()
        with get_session() as session:
            task = session.get(GenerationTask, stale_task["id"])
            task.updated_at = utc_now() - timedelta(minutes=16)
            session.commit()

        configure_store(DatabaseStore())

        with get_session() as session:
            reconciled = session.get(GenerationTask, stale_task["id"])
        self.assertEqual("timed_out", reconciled.status)
        self.assertEqual("reservation_expired", reconciled.error_code)
        replacement = self._start_task()
        self.assertEqual("running", replacement["status"])

    def test_quota_grant_and_generation_debit_are_atomic_under_concurrency(self) -> None:
        self._set_database_quota(2)
        task = self._start_task()

        with ThreadPoolExecutor(max_workers=2) as executor:
            completion = executor.submit(self._complete_task, task["id"])
            grant = executor.submit(
                store.grant_quota,
                self.user["id"],
                "image",
                1,
                "admin_grant",
                None,
            )
            completion.result()
            grant.result()

        self.assertEqual(2, self._database_quota())

    def test_quota_grant_rolls_back_balance_when_ledger_insert_fails(self) -> None:
        original_quota = self._database_quota()

        def fail_admin_ledger(_mapper, _connection, target: QuotaLedger) -> None:
            if target.reason == "admin_grant":
                raise RuntimeError("forced ledger failure")

        event.listen(QuotaLedger, "before_insert", fail_admin_ledger)
        try:
            with self.assertRaises(RuntimeError):
                store.grant_quota(self.user["id"], "image", 1, "admin_grant", None)
        finally:
            event.remove(QuotaLedger, "before_insert", fail_admin_ledger)

        self.assertEqual(original_quota, self._database_quota())

    def test_cross_canvas_input_start_and_node_delete_share_asset_then_task_lock_order(self) -> None:
        second_canvas = canvas_controller.create_canvas(
            self.project["id"], self.user["id"], "Input Canvas", 0
        )["item"]
        source_node = canvas_document_controller.create_node(
            self.project["id"],
            second_canvas["id"],
            self.user["id"],
            node_type="asset",
            content={},
            position_x=0,
            position_y=0,
            width=320,
            height=180,
        )
        source_asset = store.create_asset(
            self.user["id"],
            "image",
            "https://example.com/cross-canvas-source.png",
            None,
            project_id=self.project["id"],
            origin_canvas_id=second_canvas["id"],
            canvas_node_id=source_node["id"],
        )
        generation_controller.start_generation_task(
            user_id=self.user["id"],
            media_type="image",
            provider="agnes",
            model="agnes-image-2.1-flash",
            project_id=self.project["id"],
            origin_canvas_id=second_canvas["id"],
            canvas_node_id=source_node["id"],
        )
        tasks_locked = Event()
        asset_update_finished = Event()
        release_generation = Event()

        def observe_locks(_connection, _cursor, statement, _parameters, _context, _many) -> None:
            normalized = statement.lower()
            thread_name = current_thread().name
            if (
                thread_name.startswith("generation-start")
                and "from generation_tasks" in normalized
                and "for update" in normalized
            ):
                tasks_locked.set()
                release_generation.wait(timeout=5)
            if thread_name.startswith("node-delete") and normalized.lstrip().startswith("update assets"):
                asset_update_finished.set()

        engine = init_engine()
        event.listen(engine, "after_cursor_execute", observe_locks)
        start_pool = ThreadPoolExecutor(max_workers=1, thread_name_prefix="generation-start")
        delete_pool = ThreadPoolExecutor(max_workers=1, thread_name_prefix="node-delete")
        try:
            start_future = start_pool.submit(
                generation_controller.start_image_generation_task,
                user_id=self.user["id"],
                provider="agnes",
                model="agnes-image-2.1-flash",
                project_id=self.project["id"],
                origin_canvas_id=self.canvas_id,
                canvas_node_id=self.node["id"],
                image_ids=[source_asset["id"]],
                request_parameters={
                    "contract_version": 1,
                    "media_type": "image",
                    "model": "agnes-image-2.1-flash",
                    "size": "1K",
                    "aspect_ratio": "4:3",
                    "image_ids": [source_asset["id"]],
                },
            )
            self.assertTrue(tasks_locked.wait(timeout=5))
            delete_future = delete_pool.submit(
                canvas_document_controller.delete_node,
                self.project["id"],
                second_canvas["id"],
                source_node["id"],
                self.user["id"],
            )
            asset_update_finished.wait(timeout=0.5)
            release_generation.set()
            task, input_urls = start_future.result(timeout=5)
            delete_future.result(timeout=5)
        finally:
            release_generation.set()
            event.remove(engine, "after_cursor_execute", observe_locks)
            start_pool.shutdown(wait=True, cancel_futures=True)
            delete_pool.shutdown(wait=True, cancel_futures=True)

        self.assertEqual("running", task["status"])
        self.assertEqual(["https://example.com/cross-canvas-source.png"], input_urls)

    def test_completion_retains_valid_origin_after_canvas_is_archived(self) -> None:
        task = self._start_task()
        with get_session() as session:
            canvas = session.get(Canvas, self.canvas_id)
            canvas.status = "archived"
            session.commit()

        result = self._complete_task(task["id"])

        self.assertEqual("succeeded", result["generation_task"]["status"])
        self.assertEqual(self.canvas_id, result["asset"]["origin_canvas_id"])

    def test_me_reads_authoritative_database_quota_instead_of_process_cache(self) -> None:
        self._set_database_quota(7)
        self.assertNotEqual(7, store.quotas[self.user["id"]]["image"])

        response = self.client.get("/me", headers=self.headers)

        self.assertEqual(200, response.status_code)
        self.assertEqual(7, response.json()["quotas"]["image"])
        self.assertGreaterEqual(response.json()["quota_revision"], 0)

    def _start_task(self) -> dict:
        return generation_controller.start_generation_task(
            user_id=self.user["id"],
            media_type="image",
            provider="agnes",
            model="agnes-image-2.1-flash",
            project_id=self.project["id"],
            origin_canvas_id=self.canvas_id,
            canvas_node_id=self.node["id"],
        )

    @staticmethod
    def _complete_task(task_id: str) -> dict:
        return generation_controller.complete_generation_task(
            task_id,
            asset_type="image",
            url="https://example.com/concurrent-result.png",
            content_text=None,
            source_model="agnes-image-2.1-flash",
            duration_ms=1,
            provider_request_id="provider-concurrent",
        )

    def _set_database_quota(self, value: int) -> None:
        with get_session() as session:
            quota = session.scalar(select(Quota).where(Quota.user_id == self.user["id"]))
            quota.image_quota = value
            session.commit()

    def _database_quota(self) -> int:
        with get_session() as session:
            quota = session.scalar(select(Quota).where(Quota.user_id == self.user["id"]))
            return quota.image_quota

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
