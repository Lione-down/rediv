# T4-005 Direct Delivery Plan - GenerationTask Diagnostics And Real Smoke

Last updated: 2026-07-12

## Completed Bounded Unit - Unit B Authorized Real Smoke

Human Owner authorized paid Agnes text/image/video smoke on 2026-07-12. The credential gate and authorized real-service verification are complete.

1. Add a regression test proving a local `.env` key is ignored when the process variable is absent.
2. Change `scripts/smoke_agnes.py` to read the key directly from `os.environ` while retaining non-secret model/base URL settings.
3. Run focused smoke tests and the no-key execute preflight.
4. With a valid process-provided key, run one real smoke for each of text, image, and video and record only sanitized metadata.
5. Verify a real text business-path task/asset relationship plus a controlled non-paid provider failure in runtime MySQL.
6. Run focused and full backend regression, update durable state, and close T4-005.

Completed evidence: text/image/video provider smoke succeeded; runtime text generation persisted a succeeded task linked to its asset; a controlled image provider failure persisted a failed task without an asset; focused 11/11, generate 16/16, and full backend 189/189 tests passed.

## Objective

Implement the non-paid Unit A slice for T4-005: persist generation task diagnostics, map Agnes/provider outcomes into stable task states, expose a task query surface, add a dry-run-safe smoke script, and cover text/image/video success and failure paths with mock tests.

## Scope

- Allowed code paths: `backend/core/agnes_provider.py`, text/image/video generation routers, backend schemas/settings/tests, SQLAlchemy model registration, Alembic migration, and `scripts/smoke_agnes.py`.
- New persistence: `generation_tasks` table with comments and relationships to user/project/node/result asset where available.
- New states: `queued`, `running`, `succeeded`, `failed`, `timed_out`.
- Verification: focused mocked generate tests first, then full backend unittest regression before Unit A closure.

## Non-Goals

- No paid Agnes calls in Unit A.
- No frontend visual work.
- No Auth, quota product-rule, or MySQL foundation redesign.
- No real smoke execution until Human Owner explicitly authorizes T4-005 Unit B.

## Dependencies And Gates

- T4-003 and T4-004 are complete.
- T4-011 is complete and the current Alembic head is `d8c5b9a4e2f0`.
- Unit B real Agnes text/image/video smoke remains blocked by Human Owner cost authorization.
- Runtime secrets may be consumed from process environment by code, but tests/docs/output must not expose values.

## Implementation Slices

1. Audit existing Agnes provider, text/image/video routers, asset persistence, quota behavior, DB model registration, and test fixtures.
2. Add `GenerationTask` model, schema types, store helpers, and Alembic migration with non-empty table/field comments.
3. Integrate task lifecycle recording into generation flows while preserving existing quota and asset semantics.
4. Normalize provider/network/timeout/asset persistence errors into task statuses and sanitized diagnostics.
5. Add task query API and dry-run-safe `scripts/smoke_agnes.py` that requires explicit `--execute` for real calls.
6. Add mock tests for text, image, video, provider failure, network failure, timeout, asset persistence failure, and no-secret/no-paid-call smoke behavior.
7. Run focused tests, full backend regression, `git diff --check`, staged diff review, and credential-pattern check before commit.

## Unit A First Bounded Unit

Create this PLAN/PROGRESS, audit the existing generation/provider code, then implement the smallest persistence slice that can be verified with focused mock tests without calling Agnes.

## Acceptance Mapping

- Navicat-inspectable relationship: model/migration must relate `generation_tasks.result_asset_id` to `assets.id` and include user/project/node identifiers.
- Stable status mapping: provider and infrastructure outcomes must resolve to one of the five accepted task states.
- Mock coverage: tests must exercise text/image/video paths and required failure classes.
- No paid default behavior: smoke script and default tests must be dry-run/mock-only unless an explicit execute flag and environment are provided.
- Full backend regression: required before marking Unit A complete.

## Risks

- Existing quota rollback semantics must remain unchanged when generation fails.
- Existing tests may assume generation endpoints return only the asset payload; additions must preserve response compatibility or update schemas intentionally.
- Timeout handling must distinguish provider timeout from generic provider failure without logging secrets.
- Alembic migration must stay compatible with the shared MySQL target and repository test harness.
