# REPORT-T6-008 - Durable compact generation jobs

- State: `DONE`
- Verification outcome: `PASS`
- Date: `2026-07-23`
- Activation baseline: `6be8c41d47a20ede687fed863366e4c723b59f0b`
- Task: [TASK-T6-008](../tasks/todo/TASK-T6-008.md).
- Architecture: [REVID-T6-006-FULL-STACK-MODULAR-REFACTOR](../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).

## Delivered

- Added strict compact v2 submit, status, result, and delta DTOs under the T6-007 hard payload budgets.
- Added authenticated submit/status/result/delta/cancel/retry APIs without ordinary serialization of request snapshots, fingerprints, provider raw responses, or full legacy task/quota objects.
- Extended the existing MySQL generation-task authority with monotonic versions, bounded owner leases, restart reclaim, attempt/retry counts, cancellation state, and an indexed `SKIP LOCKED` claim path.
- Added atomic immutable idempotency: the same client request and fingerprint returns the same job before new admission checks, while a changed fingerprint fails closed.
- Added a bounded FastAPI lifespan runner with heartbeat, terminal release/failure/cancellation, fake-testable provider dispatch, and checkpointed provider request IDs.
- Added lease fencing around authoritative completion so a stale owner cannot create assets or deduct quota after reclaim; committed success cannot be overwritten by a later release failure.
- Added text/script/image/video dispatch mapping. Script uses existing text quota authority; reclaimed video jobs resume a persisted provider request instead of repeating creation.
- Preserved current generation-task compatibility reads and unchanged legacy endpoint response behavior.

## Verification

- Focused T6-008 contract/API/migration/runner/dispatcher suite: `24/24` PASS.
- Related generation idempotency, restart, transaction concurrency, Canvas transaction, migration, and runtime lifecycle regression: `44/44` PASS.
- Broad backend suite excluding only the two T6-007 future-owned RED modules `test_semantic_video_reference_contract` and `test_story_director_contract`: `606/606` PASS in `638.584s`.
- Unfiltered discovery was also run and reached the expected T6-015 semantic-reference RED after `458` tests. This is the frozen future contract recorded by REPORT-T6-007; no assertion was weakened and no T6-012/T6-015 implementation was started.
- Disposable-MySQL migration upgrade/downgrade, non-empty comments, runtime restart, lease reclaim, and single Alembic head `b7c8d9e0f1a2`: PASS.
- Compileall, activation project-state validation, `git diff --check`, strict UTF-8/no-BOM over `26` owned files, file-size, and line-length checks: PASS.
- After durable `DONE / PASS` closure, project-state validation intentionally reports only the no-active transition until the required post-push T6-009 goal-mode activation restores the single-active invariant.

## TDD Evidence

- Compact DTO/budget tests first failed `5/5` only because `schemas.generation_job` was absent, then passed after the strict schemas were added.
- API, migration, and runner tests first failed through absent routes, fields, and modules before the smallest owned implementations.
- Additional RED/GREEN cycles exposed and closed running-cancellation heartbeat, script quota, stale-owner completion, video checkpoint replay, model authority, idempotent replay ordering, and terminal overwrite defects.
- Provider verification used local fake dispatchers only. No browser request owns provider execution.

## Boundaries

- No T6-009 frontend synchronization, same-card UI, card rename, director, script workflow, image-card workflow, or semantic-video implementation was added.
- No real or paid provider call, secret access, user/runtime-data migration, destructive operation, external-account action, or incompatible legacy endpoint removal occurred.
- The migration was applied only to disposable test schemas.
- User-owned `.codex/`, `.hermes/plans/`, `output/`, `storage/`, and `test-results/` remain unmodified and excluded from delivery.

## Decision

T6-008 is `DONE / PASS`. T6-009 is dependency-ready and may activate only after this scoped delivery is committed and pushed, in a new goal-mode Codex Task with no overlapping active implementation Task.
