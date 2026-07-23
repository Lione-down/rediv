# TASK-T6-008 Progress

- State: `DONE`
- Verification outcome: `PASS`
- Task: [TASK-T6-008](../todo/TASK-T6-008.md).
- Plan: [TASK-T6-008-PLAN](TASK-T6-008-PLAN.md).
- Activation date: 2026-07-23.
- Activation baseline: `6be8c41d47a20ede687fed863366e4c723b59f0b`.

## Completed Work

- Re-read AGENTS, CURRENT, ROADMAP, the complete T6-007 Task/PLAN/PROGRESS/REPORT, the T6-006 Task/PLAN/PROGRESS/architecture, the complete detailed T6-006 execution plan, and the direct-delivery ADR.
- Confirmed `HEAD` and `origin/main` both equal the T6-007 delivery `6be8c41d47a20ede687fed863366e4c723b59f0b`.
- Confirmed the tracked worktree is clean and only preserved user-owned `.codex/`, `.hermes/plans/`, `output/`, `storage/`, and `test-results/` paths are untracked.
- Activated T6-008 as the sole implementation Task and scoped it to backend compact DTOs, durable MySQL jobs, lease/idempotency runner, versioned v2 APIs, and compatibility reads.
- Passed project-state validation before business-code edits and retained the single-active invariant throughout implementation.
- Observed the T6-007 compact contract RED boundary first: `5/5` failures caused only by the absent `schemas.generation_job` module, then implemented strict submit/status/result/delta DTOs within the frozen payload budgets.
- Added authenticated `/api/v2` submit, status, result, current project/Canvas delta, cancel, and retry APIs without exposing request snapshots, fingerprints, provider raw data, or duplicated full task/quota objects.
- Added an expand-first Alembic migration and model fields for monotonic job version, owner/expiry lease, attempt/retry counts, cancellation time, and the status/lease claim index; all new fields have non-empty MySQL comments.
- Added atomic MySQL submit/idempotency, authorization, claim with `SKIP LOCKED`, heartbeat, provider-request checkpoint, terminal release/failure/cancellation, retry, compatibility read, and delta repository operations.
- Added the bounded FastAPI lifespan runner and explicit fake-testable provider dispatcher for text/script/image/video. Video reclaim resumes an already checkpointed provider request instead of creating a duplicate remote task.
- Added lease-owner fencing to the existing authoritative completion transaction so a stale runner cannot create an asset or deduct quota after reclaim; a release failure cannot overwrite committed success.
- Added durable cancellation during an in-flight provider call, sanitized terminal failures, script-to-text quota compatibility, media/model capability authority, and replay-before-new-admission semantics.
- Preserved legacy generation endpoints and their successful `progress_stage="persisting"` compatibility snapshot by limiting new terminal-stage behavior to leased v2 completion.
- Proved one expired lease is reclaimed after a disposable-MySQL runtime restart, active leases heartbeat, provider request IDs persist before later work, and existing generation-task rows remain compactly readable.
- Completed fresh diff review, compile, Alembic single-head, activation project-state, UTF-8/no-BOM, line-length, file-size, protected-path, and diff checks.

## Remaining Work

- No T6-008 implementation or verification work remains.
- Delivery-only actions remain: exact staging, staged secret/sensitive-path review, one scoped commit, push `main`, and creation of a new goal-mode Codex Task for T6-009.

## Exact Next Action

Precisely stage only T6-008-owned files, verify the staged diff contains no sensitive or protected path, commit and push, then create a new `/goal` Codex Task that activates T6-009 only.

## Files Changed

- `ai/tasks/todo/TASK-T6-008.md`, `ai/tasks/doing/TASK-T6-008-PLAN.md`, `ai/tasks/doing/TASK-T6-008-PROGRESS.md`, `ai/state/CURRENT.md`, `ai/state/ROADMAP.md`, and `ai/reports/REPORT-T6-008.md` - durable task state and completion evidence.
- `backend/schemas/generation_job.py`, `backend/api/generation_jobs.py`, and `backend/api/router.py` - strict compact v2 contracts and authenticated routes.
- `backend/services/generation/job_service.py`, `job_runner.py`, `provider_dispatch.py`, and package markers - request-scoped service, durable runner, and provider boundary.
- `backend/models/generation_task.py`, `backend/repositories/generation_tasks.py`, `backend/repositories/records.py`, `backend/controllers/generation_records.py`, and `backend/controllers/generation_transactions.py` - MySQL authority, records, lease fencing, and compatibility.
- `backend/migrations/versions/b7c8d9e0f1a2_add_generation_job_execution_lease.py` - expand-first disposable-MySQL-proven schema.
- `backend/main.py` and `backend/settings/config.py` - bounded lifespan ownership and lease/poll settings.
- `backend/tests/test_generation_job_api_v2.py`, `test_generation_job_execution_migration.py`, `test_generation_job_provider_dispatch.py`, and `test_generation_job_runner.py` - focused API/migration/dispatch/runner proof.

## Commands Run And Results

- Required startup reads and Git baseline probes: PASS; `HEAD == origin/main == 6be8c41d47a20ede687fed863366e4c723b59f0b`.
- `backend\.venv-ci-check\Scripts\python.exe scripts\validate-project-state.py`: PASS after T6-008 activation; after durable `DONE / PASS` closure, one expected transition error remains (`expected one active T6 Task while unfinished Tasks exist, found []`) until the required post-push T6-009 goal-mode activation.
- TDD RED cycles: compact DTO `5/5` absent-module failures; API `2/2` 404; migration six-field absence; runner three-module absence; later focused REDs reproduced heartbeat cancellation, script quota, stale-owner completion, video checkpoint replay, model authority, replay admission ordering, and terminal overwrite defects before GREEN.
- Final focused command across compact contracts, budgets, v2 API, migration, runner, and dispatcher: `24/24` PASS.
- Related generation transaction/restart/concurrency/migration/runtime command: `44/44` PASS after preserving the legacy `persisting` stage contract.
- Full discovery intentionally reaches the future-owned T6-007 semantic-reference RED first after `458` tests; no assertion was weakened and T6-015 was not implemented.
- Broad backend suite excluding only `test_semantic_video_reference_contract` and `test_story_director_contract`, which T6-007 REPORT explicitly assigns to T6-015 and T6-012/T6-013: `606/606` PASS in `638.584s`.
- `python -m compileall` for touched backend modules: PASS.
- `python -m alembic -c alembic.ini heads`: single head `b7c8d9e0f1a2`.
- `git diff --check`: PASS; Git line-ending notices are normalization warnings only.
- UTF-8 strict decode and no-BOM scan: `26` owned files PASS.
- New/expanded implementation files remain under the project `500`-line limit; no line exceeds `119` characters.

## Blockers And Release Conditions

- No current blocker.
- Real/paid provider verification and any migration against user/runtime data remain explicit Human gates and were not performed.
- T6-009 frontend synchronization remains outside this Task and may start only in the required new goal-mode session after the T6-008 push.
