# Report: Runtime Rev35 Diagnostic Gate Deadlock

## Result

`PASS — RECONCILER INTERMEDIATE STATE FIXED`

Human Owner explicitly authorized Codex to implement and verify this runtime-only repair. No business file, Hermes status, Queue or Kanban state was modified.

## Root Cause

`validate_diagnostic()` required `DIAGNOSTIC_READY` for every terminal reconciliation. The Supervisor requires this gate before diagnostic/status writes and fails closed on exit `2`, so `ACKNOWLEDGED → DIAGNOSTIC_READY` was unreachable.

## Changes

- Added a regression for `ACKNOWLEDGED` with diagnostic path/hash/verdict `NONE`.
- `validate_diagnostic()` now accepts that state only during diagnostic-start confirmation, validates timezone-aware due and requires all pending diagnostic fields to remain `NONE`.
- `DIAGNOSTIC_READY` continues to require a real diagnostic file and matching SHA256.
- Pending state preserves `Runtime Diagnostic Due Status = PENDING`; produced state uses `SATISFIED`.
- Reconciliation text now distinguishes `ACKNOWLEDGED / DIAGNOSTIC PENDING` from `DIAGNOSTIC PRODUCED`.
- Added a regression and bounded insertion path for a missing current-revision reconciliation row; other canonical fields still require exactly one existing row.
- Added a one-way `DIAGNOSTIC_READY` transition from diagnostic-start confirmation to terminal-stop confirmation, allowing PMC to close a produced diagnostic without another exit-2 deadlock.

## TDD Evidence

- RED: new pending-ACK regression failed with exit `2`, `terminal reconciliation requires DIAGNOSTIC_READY`.
- GREEN: the same regression passed after the minimal implementation.

## Verification

| Check | Result |
|---|---|
| Python compile | PASS |
| Reconciler targeted suite | `9 passed` |
| Full `ai/runtime/tests` | `24 passed` |
| Role-contract verifier | `ROLE_CONTRACTS_OK` |
| Scoped `git diff --check` | PASS |
| Real rev35 `--check` | `STATUS_MISMATCH`, exit `1` |

The real rev35 gate now reports exactly three canonical mismatches instead of a reconciliation error: Task SHA256, Queue SHA256 and the missing rev35 pending reconciliation field. A dedicated regression proves that one `--apply` inserts the missing current-revision row, read-back `--check` succeeds and subsequent apply is idempotent. This is the intended handoff to Hermes before diagnostics-only collection.

## Remaining Work

Hermes must apply the canonical pending state and generate a fresh rev35 runtime diagnostic for the original `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION`. This report does not claim that the original worker finalization fault is fixed and does not authorize revision 36 or Unit B execution.
