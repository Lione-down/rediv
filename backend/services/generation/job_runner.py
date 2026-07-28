from __future__ import annotations

import asyncio
from contextlib import suppress

from controllers.generation_transactions import complete_generation_task
from core.generation_task_utils import error_code_for_exception, sanitize_error_message
from repositories.generation_tasks import (
    GenerationJobStateError,
    GenerationTaskRepository,
)


class GenerationJobCancellationRequested(Exception):
    pass


class GenerationJobRunner:
    def __init__(
        self,
        *,
        dispatcher,
        owner_id: str,
        lease_seconds: int,
        poll_interval_seconds: float = 1,
        repository: GenerationTaskRepository | None = None,
    ) -> None:
        self.dispatcher = dispatcher
        self.owner_id = owner_id
        self.lease_seconds = lease_seconds
        self.poll_interval_seconds = poll_interval_seconds
        self.repository = repository or GenerationTaskRepository()
        self._stop_event = asyncio.Event()
        self._task: asyncio.Task | None = None

    def start(self) -> None:
        if self._task is not None:
            raise RuntimeError("Generation job runner is already started")
        self._task = asyncio.create_task(
            self._run_loop(),
            name=f"generation-job-runner:{self.owner_id}",
        )

    async def stop(self) -> None:
        self._stop_event.set()
        if self._task is None:
            return
        self._task.cancel()
        with suppress(asyncio.CancelledError):
            await self._task
        self._task = None

    async def _run_loop(self) -> None:
        while not self._stop_event.is_set():
            processed = await self.run_once()
            if not processed:
                try:
                    await asyncio.wait_for(
                        self._stop_event.wait(),
                        timeout=self.poll_interval_seconds,
                    )
                except TimeoutError:
                    pass

    async def run_once(self) -> bool:
        job = self.repository.claim_next(
            owner_id=self.owner_id,
            lease_seconds=self.lease_seconds,
        )
        if job is None:
            return self._reconcile_workflow_run()
        try:
            result = await self._dispatch_with_heartbeat(job)
            current = self.repository.get(job["id"])
            if current is not None and current["status"] == "cancel_requested":
                self.repository.finish_cancellation(
                    job["id"],
                    owner_id=self.owner_id,
                )
                return True
            complete_generation_task(
                job["id"],
                asset_type=result.asset_type,
                url=result.url,
                content_text=result.content_text,
                source_model=result.source_model,
                duration_ms=0,
                provider_request_id=result.provider_request_id,
                lease_owner=self.owner_id,
            )
            self.repository.release_after_terminal(
                job["id"],
                owner_id=self.owner_id,
            )
        except GenerationJobCancellationRequested:
            with suppress(GenerationJobStateError):
                self.repository.finish_cancellation(
                    job["id"],
                    owner_id=self.owner_id,
                )
        except asyncio.CancelledError:
            raise
        except Exception as error:
            current = self.repository.get(job["id"])
            if current is not None and current["status"] == "cancel_requested":
                with suppress(GenerationJobStateError):
                    self.repository.finish_cancellation(
                        job["id"],
                        owner_id=self.owner_id,
                    )
            else:
                with suppress(GenerationJobStateError):
                    self.repository.fail_execution(
                        job["id"],
                        owner_id=self.owner_id,
                        error_code=error_code_for_exception(error),
                        error_message=sanitize_error_message(error),
                    )
        finally:
            self._reconcile_workflow_run(job["id"])
        return True

    @staticmethod
    def _reconcile_workflow_run(job_id: str | None = None) -> bool:
        from services.workflow_templates.runs import (
            reconcile_next_workflow_run,
            reconcile_workflow_run_for_job,
        )

        with suppress(Exception):
            return (
                reconcile_workflow_run_for_job(job_id)
                if job_id is not None
                else reconcile_next_workflow_run()
            )
        return False

    async def _dispatch_with_heartbeat(self, job: dict):
        dispatch_task = asyncio.create_task(
            self.dispatcher.dispatch(
                job,
                lambda provider_request_id: self.repository.record_provider_request(
                    job["id"],
                    owner_id=self.owner_id,
                    provider_request_id=provider_request_id,
                ),
                lambda progress: self.repository.heartbeat(
                    job["id"],
                    owner_id=self.owner_id,
                    lease_seconds=self.lease_seconds,
                    progress=progress,
                ),
            )
        )
        heartbeat_task = asyncio.create_task(self._heartbeat_lease(job["id"]))
        try:
            done, _pending = await asyncio.wait(
                {dispatch_task, heartbeat_task},
                return_when=asyncio.FIRST_COMPLETED,
            )
            if heartbeat_task in done:
                await heartbeat_task
                raise GenerationJobStateError("Generation job heartbeat stopped unexpectedly")
            return await dispatch_task
        finally:
            heartbeat_task.cancel()
            dispatch_task.cancel()
            with suppress(asyncio.CancelledError):
                await heartbeat_task
            with suppress(asyncio.CancelledError):
                await dispatch_task

    async def _heartbeat_lease(self, job_id: str) -> None:
        interval = max(0.1, self.lease_seconds / 3)
        while True:
            await asyncio.sleep(interval)
            job = self.repository.heartbeat(
                job_id,
                owner_id=self.owner_id,
                lease_seconds=self.lease_seconds,
            )
            if job["status"] == "cancel_requested":
                raise GenerationJobCancellationRequested
