# TASK-T6-008 Implementation Plan

- State: `DONE`
- Verification outcome: `PASS`
- Active unit: `Complete`
- Task: [TASK-T6-008](../todo/TASK-T6-008.md).
- Progress: [TASK-T6-008-PROGRESS](TASK-T6-008-PROGRESS.md).
- Architecture: [REVID-T6-006-FULL-STACK-MODULAR-REFACTOR](../../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).
- Activation baseline: `main`, `HEAD == origin/main == 6be8c41d47a20ede687fed863366e4c723b59f0b`.

## Delivery rule

Implement only the backend durable compact-job slice frozen by T6-007. Every production behavior follows a focused RED assertion, observed failure, smallest GREEN, and refactor while green. Legacy endpoints remain unchanged until T6-009 or later owns client migration.

## Unit sequence

### Unit 0 - Activation and contract inventory

- Status: `complete`
- Create and activate the sole T6-008 Task, PLAN, and PROGRESS.
- Reconcile CURRENT and ROADMAP, then pass project-state validation before business-code edits.
- Inspect the compact RED tests, generation-task model/repository/router/lifespan authorities, migrations, disposable-MySQL harness, and overlapping worktree paths.

### Unit 1 - Compact DTO and API RED to GREEN

- Status: `complete`
- Run the T6-007 compact DTO and payload-budget tests and retain the absent-module RED fingerprints.
- Add strict v2 submit/status/result/delta/cancel/retry schemas and router contracts.
- Keep ordinary DTOs within hard budgets and exclude internal/provider/request payloads.

### Unit 2 - Durable persistence and idempotency RED to GREEN

- Status: `complete`
- Add focused repository/service tests for immutable idempotency, authorization, monotonic versioning, and compatibility reads.
- Add an expand-first Alembic migration with non-empty MySQL comments for only the fields the tests prove necessary.
- Implement submit, status/result read, delta listing, cancel, and retry through request-scoped services and repository methods.

### Unit 3 - Lease runner and restart recovery RED to GREEN

- Status: `complete`
- Add focused disposable-MySQL tests for claim, heartbeat, provider request-ID persistence, expiry reclaim, completion, and failure.
- Add a bounded lifespan runner and provider-dispatch boundary; tests use a fake provider only.
- Prove browser/request cancellation does not own the durable job lifecycle.

### Unit 4 - Compatibility and focused regression

- Status: `complete`
- Keep legacy media endpoints and existing task records readable.
- Run T6-008 focused schema, budget, idempotency, migration, restart/reclaim, and compatibility suites.
- Run relevant broader backend regression only after focused GREEN.

### Unit 5 - Fresh review and delivery

- Status: `complete`
- Review the complete diff against scope, non-goals, database comments, transaction boundaries, and payload exclusions.
- Run project-state, UTF-8/no-BOM, diff, sensitive-path, secret-signature, and exact-staging checks.
- Reconcile Task/PLAN/PROGRESS/CURRENT/ROADMAP, create REPORT only after all criteria pass, commit one scoped change, and push `main`.
- If T6-009 remains dependency-ready, create a new Codex goal-mode Task for T6-009 only after the T6-008 push.

## Verification order

1. Exact focused RED fingerprint.
2. Smallest coherent GREEN for that behavior.
3. Focused disposable-MySQL integration proof.
4. Relevant broad backend regression.
5. Migration, state, diff, hygiene, staged-secret, commit, and push proof.

## Stop conditions

- Stop before T6-009 frontend work or any later Task behavior.
- Stop before a real/paid provider call, secret access, user/runtime migration, destructive operation, external-account change, or legacy endpoint removal.
- Stop on unknown overlapping edits in an owned path.
- End every partial run with PROGRESS and CURRENT recording exact completed work, remaining work, next action, changed files, commands/results, and blocker release conditions.
