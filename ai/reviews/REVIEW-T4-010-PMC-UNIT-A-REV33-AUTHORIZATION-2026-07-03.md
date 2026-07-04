# PMC Review — T4-010 Unit A Revision 33 Authorization

## Verdict

`PMC_APPROVED — DISPATCH_ONLY / WAITING_FOR_HERMES_ACK`

## Authorization

- Revision: `phase4-wave3-workspace-shell-unit-a-static-build-2026-07-03-33`
- Task: `T4-010-UNIT-A`
- Task path: `ai/tasks/todo/TASK-T4-010-UNIT-A.md`
- Dispatcher: `revid-dispatcher`
- Executor: `revid-frontend`
- Action: `DISPATCH_ONLY`
- Attempt: business attempt `0` continuation; at most one process retry per card
- Stop After: `T4_010_UNIT_A_STATIC_BUILD_REPORT_READY`

## Evidence Reviewed

- Revision 32 is terminal `PMC_BLOCKED / INFRASTRUCTURE_BLOCKED`; its Dispatcher and Executor cards are blocked/done historical evidence and are not reusable.
- Deterministic execution-status reconciliation returns `STATUS_OK`; `ROLE_CONTRACTS_OK` passes.
- Hermes board has `0` cards in `ready`, `running` or `review`.
- Fresh `revid-frontend` session `20260703_170448_3ce6cd` performed project-root artifact write/read-back with four real tool calls and no business diff change.
- Human Owner completed credential rotation; the fresh provider probe returned `ROTATION_PROBE_OK` and the security pause is closed.
- Unit A owns the existing partial diff only in `Workspace.vue` and the four `components/workspace` SFCs. Current line counts are within the Task limits.

## Scope Decision

Revision 33 is a bounded static/build closure. It may preserve or minimally correct only the five Task Allowed Business Files and may write only the three Unit A Executor artifacts. Browser, visual acceptance, Reviewer, HANDOFF, Canvas/API/backend changes and Unit B work are not authorized.

The revision inherits both stable fingerprints without clearing them:

- `REV31_DISPATCHER_TERMINAL_TOOL_NOT_ALLOWED`
- `REV32_EXECUTOR_ITERATION_BUDGET_EXHAUSTED_WITH_UNCANONICAL_ARTIFACTS`

## Hermes Gate

Hermes must ACK this exact revision, run the project-owned runtime deploy/verifier gate, and create exactly one fresh `revid-dispatcher` card with the Queue idempotency key. The Dispatcher must atomically create one `revid-frontend` child and stop. Any contract mismatch, duplicate chain, runtime regression or unexpected ownership is `INFRASTRUCTURE_BLOCKED`; no automatic revision 34 is authorized.

## Human Decision

`NO`. This authorization does not change product direction, schema/API contract, paid resources or destructive permissions.
