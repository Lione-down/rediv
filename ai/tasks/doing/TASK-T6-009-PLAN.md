# TASK-T6-009 Implementation Plan

- State: `DONE`
- Verification outcome: `PASS`
- Active unit: none; Units 0 through 5 complete.
- Task: [TASK-T6-009](../todo/TASK-T6-009.md).
- Progress: [TASK-T6-009-PROGRESS](TASK-T6-009-PROGRESS.md).
- Architecture: [REVID-T6-006-FULL-STACK-MODULAR-REFACTOR](../../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).
- Activation baseline: `main`, `HEAD == origin/main == 1159d120f077d152da01ee6952e9dc2968a6fe8f`.

## Delivery rule

Implement only frontend incremental current-Canvas job synchronization. Every production behavior must follow a focused failing test, observed expected failure, smallest GREEN, and refactor while green. Build the frontend before all preview-backed Playwright proof.

## Unit sequence

### Unit 0 - Activation and contract inventory

- Status: `complete`
- Create and activate the sole T6-009 Task, PLAN, and PROGRESS.
- Reconcile CURRENT and ROADMAP, then pass project-state validation before business-code edits.
- Inspect frozen durable-generation browser RED assertions, v2 backend DTO/routes, current resource task API/store, generation service, node-persisted job bindings, and polling lifecycle.

### Unit 1 - Compact frontend contracts and client

- Status: `complete`
- Write focused unit/browser assertions for strict submit/status/result/delta parsing, payload exclusions, Canvas scope, cursor propagation, and stale-version rejection.
- Add typed `generation-job-api` and focused state/runtime modules with no dependency on legacy `request_parameters`.
- Keep legacy project task parsing isolated for history/admin compatibility.

### Unit 2 - Current-Canvas delta runtime

- Status: `complete`
- Write focused RED assertions proving the active runtime never calls `/api/generation-tasks`, polls only with non-terminal jobs, and uses the current project/Canvas cursor.
- Integrate delta synchronization through `use-canvas-generation-runtime`.
- Preserve bounded retry/backoff and context invalidation without server cancellation or Canvas mutation.

### Unit 3 - Reload, Canvas switch, and result handoff

- Status: `complete`
- Write RED assertions for persisted job restoration, same-job reload, old-context cancellation, return catch-up, terminal result single-fetch, and stale/out-of-order deltas.
- Apply only the existing compatibility result handoff owned by current code; do not implement T6-010/T6-014 same-card canonical result behavior.
- Prove no graph/history/selection/camera mutation occurs on active ticks.

### Unit 4 - Focused and broad verification

- Status: `complete`
- Run focused unit/browser tests first.
- Rebuild frontend, then run related generation runtime/resource pagination/durable contract browser regression.
- Run the relevant broad frontend suite and classify future-owned T6-010 through T6-015 RED assertions without weakening them.

### Unit 5 - Fresh review and delivery

- Status: `complete`
- Review the complete diff against scope, request/payload budgets, cursor isolation, timer cleanup, compatibility, and protected-path boundaries.
- Reconcile Task/PLAN/PROGRESS/CURRENT/ROADMAP, create REPORT only after all acceptance criteria pass, then run project-state, UTF-8, diff, sensitive-path, and staged-secret checks.
- Precisely stage T6-009-owned files, commit one scoped change, push `main`, and only then create the next dependency-ready T6 Task in a new goal-mode Codex session.

## Verification order

1. Exact focused RED fingerprint.
2. Smallest coherent GREEN.
3. Focused frontend unit/browser proof.
4. Fresh production build.
5. Related browser regression, then relevant broad regression.
6. State, diff, hygiene, staged-secret, commit, and push proof.

## Stop conditions

- Stop before T6-010 or any later Task behavior.
- Stop before a real/paid provider call, secret access, user/runtime migration, destructive operation, external-account change, or legacy compatibility removal.
- Stop on unknown overlapping edits in an owned path.
- End every partial run with PROGRESS and CURRENT recording exact completed work, remaining work, next action, changed files, commands/results, and blocker release conditions.

## Completion note

The v2 runtime owns current-Canvas compact status/delta/result polling. One initial project task snapshot and the unbound
legacy request fallback remain intentionally available until T6-016, but a persisted v2 job prevents repeated legacy
polling for that card.
