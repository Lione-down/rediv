from __future__ import annotations

import asyncio
import sys
import unittest
from datetime import timedelta
from pathlib import Path
from uuid import uuid4

from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from controllers.store import DatabaseStore, configure_store, store
from models.base import get_session, utc_now
from models.generation_task import GenerationTask
from tests.mysql_test_database import MySQLTestDatabase


class _CheckpointingTextDispatcher:
    def __init__(self) -> None:
        self.provider_request_was_persisted = False
        self.calls = 0

    async def dispatch(self, job, persist_provider_request_id):
        try:
            from services.generation.provider_dispatch import ProviderDispatchResult
        except ModuleNotFoundError as error:
            raise AssertionError(
                "T6-008 RED [generation-provider-dispatch-module-absent]"
            ) from error
        self.calls += 1
        persist_provider_request_id("provider-job-1")
        with get_session() as session:
            persisted = session.get(GenerationTask, job["id"])
            self.provider_request_was_persisted = (
                persisted is not None
                and persisted.provider_request_id == "provider-job-1"
                and persisted.status == "running"
            )
        return ProviderDispatchResult(
            asset_type="prompt",
            content_text="持久化完成的文本",
            url=None,
            provider_request_id="provider-job-1",
            source_model=job["model"],
        )


class _BlockingTextDispatcher:
    def __init__(self) -> None:
        self.started = asyncio.Event()
        self.release = asyncio.Event()

    async def dispatch(self, job, persist_provider_request_id):
        from services.generation.provider_dispatch import ProviderDispatchResult

        persist_provider_request_id("provider-long-running")
        self.started.set()
        await self.release.wait()
        return ProviderDispatchResult(
            asset_type="prompt",
            content_text="long running result",
            url=None,
            provider_request_id="provider-long-running",
            source_model=job["model"],
        )


class _FailingDispatcher:
    async def dispatch(self, job, persist_provider_request_id):
        raise RuntimeError("Authorization=Bearer secret-provider-token")


class GenerationJobRunnerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mysql_database = MySQLTestDatabase("revid_test_generation_job_runner")
        cls.mysql_database.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.mysql_database.stop()

    def setUp(self) -> None:
        configure_store(DatabaseStore())
        suffix = str(uuid4())
        self.user = store.create_user(f"runner-{suffix}", "")
        store.grant_default_quotas(self.user["id"])
        self.project = store.create_project(self.user["id"], f"Runner {suffix}")
        self.canvas_id = store.get_first_canvas_id(self.project["id"])
        self.node = store.create_node(
            self.project["id"],
            self.user["id"],
            "generation",
            {},
            0,
            0,
            320,
            180,
        )

    def _service(self):
        try:
            from services.generation.job_service import GenerationJobService
        except ModuleNotFoundError as error:
            self.fail("T6-008 RED [generation-job-service-module-absent]")
            raise error
        return GenerationJobService()

    def _submit(self, prompt: str, *, media_type: str = "text"):
        return self._service().submit(
            user_id=self.user["id"],
            project_id=self.project["id"],
            canvas_id=self.canvas_id,
            node_id=self.node["id"],
            media_type=media_type,
            provider_id="agnes",
            model_id="agnes-2.0-flash",
            client_request_id=str(uuid4()),
            input_payload={"prompt": prompt},
        )

    def test_runner_checkpoints_provider_id_and_persists_one_result(self) -> None:
        try:
            from services.generation.job_runner import GenerationJobRunner
        except ModuleNotFoundError as error:
            self.fail("T6-008 RED [generation-job-runner-module-absent]")
            raise error
        receipt = self._submit("durable runner")
        dispatcher = _CheckpointingTextDispatcher()
        runner = GenerationJobRunner(
            dispatcher=dispatcher,
            owner_id="runner-one",
            lease_seconds=60,
        )

        processed = asyncio.run(runner.run_once())

        self.assertTrue(processed)
        self.assertEqual(1, dispatcher.calls)
        self.assertTrue(dispatcher.provider_request_was_persisted)
        status = self._service().get_status(self.user["id"], receipt.job_id)
        self.assertEqual("succeeded", status.status)
        self.assertIsNone(status.stage)
        self.assertGreater(status.version, receipt.version)
        result = self._service().get_result(self.user["id"], receipt.job_id)
        self.assertEqual("持久化完成的文本", result.result.content)
        with get_session() as session:
            task = session.get(GenerationTask, receipt.job_id)
            self.assertIsNone(task.lease_owner)
            self.assertIsNone(task.lease_expires_at)

    def test_release_failure_cannot_overwrite_committed_success(self) -> None:
        from repositories.generation_tasks import GenerationTaskRepository
        from services.generation.job_runner import GenerationJobRunner

        receipt = self._submit("terminal state fence")
        repository = GenerationTaskRepository()
        release_after_terminal = repository.release_after_terminal

        def fail_release(_task_id: str, *, owner_id: str) -> dict:
            raise RuntimeError(f"release failed for {owner_id}")

        repository.release_after_terminal = fail_release
        runner = GenerationJobRunner(
            dispatcher=_CheckpointingTextDispatcher(),
            owner_id="runner-release-failure",
            lease_seconds=60,
            repository=repository,
        )

        processed = asyncio.run(runner.run_once())

        self.assertTrue(processed)
        status = self._service().get_status(self.user["id"], receipt.job_id)
        self.assertEqual("succeeded", status.status)
        self.assertIsNotNone(status.result_asset_id)
        release_after_terminal(
            receipt.job_id,
            owner_id="runner-release-failure",
        )

    def test_script_job_uses_text_quota_and_returns_one_canonical_text_result(self) -> None:
        from services.generation.job_runner import GenerationJobRunner

        receipt = self._submit("script runner", media_type="script")
        runner = GenerationJobRunner(
            dispatcher=_CheckpointingTextDispatcher(),
            owner_id="runner-script",
            lease_seconds=60,
        )

        processed = asyncio.run(runner.run_once())

        self.assertTrue(processed)
        result = self._service().get_result(self.user["id"], receipt.job_id)
        self.assertEqual("script", result.result.media_type)
        self.assertEqual("持久化完成的文本", result.result.content)

    def test_provider_failure_is_terminal_versioned_released_and_sanitized(self) -> None:
        from services.generation.job_runner import GenerationJobRunner

        receipt = self._submit("provider failure")
        runner = GenerationJobRunner(
            dispatcher=_FailingDispatcher(),
            owner_id="runner-failure",
            lease_seconds=60,
        )

        processed = asyncio.run(runner.run_once())

        self.assertTrue(processed)
        status = self._service().get_status(self.user["id"], receipt.job_id)
        self.assertEqual("failed", status.status)
        self.assertIsNone(status.stage)
        self.assertGreater(status.version, receipt.version)
        self.assertIn("<redacted>", status.error)
        self.assertNotIn("secret-provider-token", status.error)
        with get_session() as session:
            task = session.get(GenerationTask, receipt.job_id)
            self.assertIsNone(task.lease_owner)
            self.assertIsNone(task.lease_expires_at)

    def test_expired_running_lease_is_reclaimed_once_by_another_owner(self) -> None:
        try:
            from repositories.generation_tasks import GenerationTaskRepository
        except ModuleNotFoundError as error:
            self.fail("T6-008 RED [generation-job-repository-module-absent]")
            raise error
        receipt = self._submit("lease reclaim")
        repository = GenerationTaskRepository()
        claimed_at = utc_now()

        first = repository.claim_next(
            owner_id="runner-one",
            lease_seconds=60,
            now=claimed_at,
        )
        before_expiry = repository.claim_next(
            owner_id="runner-two",
            lease_seconds=60,
            now=claimed_at + timedelta(seconds=30),
        )
        restart = self.mysql_database.restart_runtime()
        after_expiry = repository.claim_next(
            owner_id="runner-two",
            lease_seconds=60,
            now=claimed_at + timedelta(seconds=61),
        )
        duplicate = repository.claim_next(
            owner_id="runner-three",
            lease_seconds=60,
            now=claimed_at + timedelta(seconds=62),
        )

        self.assertEqual(receipt.job_id, first["id"])
        self.assertIsNone(before_expiry)
        self.assertTrue(restart["match"])
        self.assertEqual(receipt.job_id, after_expiry["id"])
        self.assertEqual("runner-two", after_expiry["lease_owner"])
        self.assertEqual(2, after_expiry["attempt_count"])
        self.assertIsNone(duplicate)
        with get_session() as session:
            task = session.scalar(
                select(GenerationTask).where(GenerationTask.id == receipt.job_id)
            )
            task.status = "failed"
            task.error_code = "test_cleanup"
            task.error_message = "Focused lease test cleanup"
            task.lease_owner = None
            task.lease_expires_at = None
            session.commit()

    def test_stale_lease_owner_cannot_persist_result_after_reclaim(self) -> None:
        from controllers.generation_errors import GenerationTaskStateError
        from controllers.generation_transactions import complete_generation_task
        from repositories.generation_tasks import GenerationTaskRepository

        receipt = self._submit("stale completion")
        repository = GenerationTaskRepository()
        claimed_at = utc_now()
        repository.claim_next(
            owner_id="runner-stale",
            lease_seconds=60,
            now=claimed_at,
        )
        repository.claim_next(
            owner_id="runner-current",
            lease_seconds=60,
            now=claimed_at + timedelta(seconds=61),
        )

        with self.assertRaises(GenerationTaskStateError):
            complete_generation_task(
                receipt.job_id,
                asset_type="prompt",
                url=None,
                content_text="must not persist",
                source_model="agnes-2.0-flash",
                duration_ms=0,
                provider_request_id="stale-provider-request",
                lease_owner="runner-stale",
            )

        current = repository.get(receipt.job_id)
        self.assertEqual("running", current["status"])
        self.assertEqual("runner-current", current["lease_owner"])
        self.assertIsNone(current["result_asset_id"])
        repository.fail_execution(
            receipt.job_id,
            owner_id="runner-current",
            error_code="test_cleanup",
            error_message="Focused lease fence test cleanup",
        )

    def test_runner_heartbeats_while_provider_call_is_in_flight(self) -> None:
        from repositories.generation_tasks import GenerationTaskRepository
        from services.generation.job_runner import GenerationJobRunner

        receipt = self._submit("heartbeat")
        dispatcher = _BlockingTextDispatcher()
        runner = GenerationJobRunner(
            dispatcher=dispatcher,
            owner_id="runner-heartbeat",
            lease_seconds=1,
            poll_interval_seconds=0.05,
        )
        repository = GenerationTaskRepository()

        async def scenario() -> dict | None:
            execution = asyncio.create_task(runner.run_once())
            await dispatcher.started.wait()
            try:
                await asyncio.sleep(1.1)
                return repository.claim_next(
                    owner_id="runner-duplicate",
                    lease_seconds=1,
                )
            finally:
                dispatcher.release.set()
                await execution

        duplicate = asyncio.run(scenario())

        self.assertIsNone(duplicate)
        self.assertEqual(
            "succeeded",
            self._service().get_status(self.user["id"], receipt.job_id).status,
        )

    def test_running_cancellation_prevents_result_persistence_and_finishes_cancelled(self) -> None:
        from services.generation.job_runner import GenerationJobRunner

        receipt = self._submit("cancel running")
        dispatcher = _BlockingTextDispatcher()
        runner = GenerationJobRunner(
            dispatcher=dispatcher,
            owner_id="runner-cancel",
            lease_seconds=1,
        )

        async def scenario() -> str:
            execution = asyncio.create_task(runner.run_once())
            await dispatcher.started.wait()
            cancelled = self._service().cancel(self.user["id"], receipt.job_id)
            try:
                await asyncio.wait_for(execution, timeout=1)
                return cancelled.status
            finally:
                dispatcher.release.set()
                if not execution.done():
                    await execution

        intermediate_status = asyncio.run(scenario())
        final_status = self._service().get_status(self.user["id"], receipt.job_id)

        self.assertEqual("cancel_requested", intermediate_status)
        self.assertEqual("cancelled", final_status.status)
        self.assertIsNone(final_status.result_asset_id)

    def test_legacy_generation_task_with_canvas_binding_has_compact_compatibility_read(self) -> None:
        legacy = store.create_generation_task(
            self.user["id"],
            "image",
            "agnes",
            "agnes-image-2.1-flash",
            project_id=self.project["id"],
            origin_canvas_id=self.canvas_id,
            canvas_node_id=self.node["id"],
            request_parameters={"legacy": "large-internal-value"},
            status="queued",
        )

        status = self._service().get_status(self.user["id"], legacy["id"])

        self.assertEqual(legacy["id"], status.job_id)
        self.assertEqual(self.node["id"], status.node_id)
        self.assertEqual(1, status.version)
        self.assertNotIn("request_parameters", status.model_dump(mode="json"))


if __name__ == "__main__":
    unittest.main()
