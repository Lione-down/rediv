# TASK-T4-002-UNIT-C2-REV26 — AC3 Remediation with Atomic Dispatch

## Status

`REPORT_READY — REVIEW LIFECYCLE 26r1 TERMINAL INFRASTRUCTURE_BLOCKED`

## Revision

`phase4-wave2-unit-c2-ac3-stale-same-remediation-atomic-dispatch-2026-06-29-26`

## Authorization

Revision `-25` is terminal infrastructure evidence. Dispatcher `t_cc15e296` and child `t_25ac2145` must not be retried, claimed, promoted, unblocked, reparented, deleted or reused.

PMC accepted the Hermes atomic dispatch runtime fix in `ai/reviews/REVIEW-T4-002-PMC-HERMES-ATOMIC-DISPATCH-FIX-PASS-2026-06-29.md`. Revision `-26` is a fresh bounded runtime continuation with new cards and idempotency keys. It is not a new business attempt and does not clear any failure fingerprint.

## Objective

Fix `migrate_table()` so identical existing `stale_same` rows never enter the INSERT execution set, while preserving same-PK different-value fail-closed behavior, rollback and report semantics.

## Scope and Allowed Files

Executor may modify only:

- `backend/scripts/migrate_sqlite_to_mysql.py`
- `backend/tests/test_migration_tool.py`

Executor may create only:

- `ai/tasks/doing/TASK-T4-002-UNIT-C2-REV26-PLAN.md`
- `ai/tasks/doing/TASK-T4-002-UNIT-C2-REV26-PROGRESS.md`
- `ai/reports/REPORT-T4-002-UNIT-C2-REV26.md`

Unknown current modifications to either business Allowed File are a stop condition. Preserve unrelated user and project changes.

## Non-goals

- No schema, API contract, migration version or frontend change.
- No broad refactor or unrelated test cleanup.
- No Reviewer, HANDOFF, REWORK or additional lifecycle card.
- No access to `.env`, credentials, `revid_db` or any non-disposable database.

## Dispatcher Contract

Supervisor creates exactly one fresh `revid-dispatcher` card through `ai/runtime/create-hermes-coordinator.py` with:

- Action: `DISPATCH_ONLY`
- Revision: `phase4-wave2-unit-c2-ac3-stale-same-remediation-atomic-dispatch-2026-06-29-26`
- Task path: `ai/tasks/todo/TASK-T4-002-UNIT-C2-REV26.md`
- Dispatch idempotency: `revid:phase4-wave2-unit-c2-ac3-stale-same-remediation-atomic-dispatch-2026-06-29-26:T4-002:dispatch`
- Max runtime: `120s`; at most one process retry
- Executor profile: `revid-backend`

Dispatcher creates exactly one Executor child whose only parent is the current Dispatcher:

- Idempotency: `revid:phase4-wave2-unit-c2-ac3-stale-same-remediation-atomic-dispatch-2026-06-29-26:T4-002:execute:0`
- Max runtime: `1800s`; at most one process retry
- Body: exact revision/task path, two writable business files, three allowed rev26 artifacts, Required Verification, ADR-003 gates and prohibition on Reviewer/HANDOFF

The runtime must atomically commit child create/link, Dispatcher completion and child promotion. The Dispatcher must not run tests, inspect broad project state, write project files, wait for the Executor or make a follow-up model call after terminal transition. Any persisted contract mismatch or non-atomic topology is `INFRASTRUCTURE_BLOCKED`.

## Implementation Constraints

- Filter identical existing `stale_same` rows out of the INSERT execution set.
- Preserve fail-closed behavior for same-PK different-value `stale_diff` rows before writes.
- Preserve rollback and `inserted` / `stale_same` / `stale_diff` / `error` report semantics.
- Add or adjust only tests required to prove stale-same-only and mixed new/stale-same behavior.

## Required Verification

Run in this exact order from the project backend virtual environment:

```powershell
python -m py_compile backend/scripts/migrate_sqlite_to_mysql.py backend/tests/test_migration_tool.py
python -m pytest backend/tests/test_migration_tool.py::TestUnitB::test_unit_b_ac10_stale_same_ok backend/tests/test_migration_tool.py::TestUnitB::test_unit_b_ac10_mixed_rows -q -p no:cacheprovider
python -m pytest backend/tests/test_migration_tool.py::TestMigrationTool::test_ac1_dry_run_no_changes backend/tests/test_migration_tool.py::TestMigrationTool::test_ac2_full_migration_succeeds backend/tests/test_migration_tool.py::TestMigrationTool::test_ac3_idempotency backend/tests/test_migration_tool.py::TestMigrationTool::test_ac5_source_immutable -q -p no:cacheprovider
git diff --check -- backend/scripts/migrate_sqlite_to_mysql.py backend/tests/test_migration_tool.py
```

Real MySQL verification may use only runtime `REVID_TEST_MYSQL_ADMIN_URL` and database `revid_test_t4_002`. Never read `.env`, print credentials or touch `revid_db`. Missing/ambiguous identity, insufficient permission, cleanup failure, skip or mock substitution is BLOCKED, not PASS.

## Acceptance Criteria

- Unit stale-same-only and mixed new/stale-same selectors pass.
- Real disposable-MySQL AC1/AC2/AC3/AC5 all pass in fixed order with no skip/mock substitution.
- Existing identical rows are not inserted; new rows insert once; stale-diff aborts before writes.
- Report counts preserve inserted/stale_same/stale_diff/error meaning.
- REPORT records exact commands, exit codes, pass/fail/skip counts, disposable database identity, cleanup result and unverified items.
- No secret leak, unauthorized database access, Scope Drift or unknown business-file ownership.

## Failure Fingerprint Inheritance

Inherit all T4-002 fingerprints through revision `-25`, including:

- `AC3_STALE_SAME_DUPLICATE_INSERT`
- `REV23_COORDINATOR_MISSING_ACTION_MARKER`
- `SUPERVISOR_BASH_POWERSHELL_VARIABLE_EXPANSION_AND_UNAUTHORIZED_FALLBACK`
- `REV24_REVID_PM_PRE_DISPATCH_TIMEOUT`
- `REV25_DISPATCHER_TIMEOUT_WITH_CHILD`

The accepted atomic runtime fix remediates the last failure class for future chains but does not erase it.

## Stop Condition

Stop at `UNIT_C2_AC3_REMEDIATION_REPORT_READY_REV26`. Executor must not create Reviewer/HANDOFF. PMC will inspect the REPORT and actual diff before deciding review lifecycle continuation, bounded REWORK or BLOCKED.

## Revision 26r1 Review Lifecycle Authorization

PMC inspected the revision 26 REPORT and actual Allowed Files diff in `ai/reviews/REVIEW-T4-002-PMC-UNIT-C2-REV26-REVIEW-LIFECYCLE-2026-06-29.md` and authorized the lifecycle-only Queue revision `phase4-wave2-unit-c2-rev26-review-dispatch-2026-06-29-26r1`.

`REVIEW_DISPATCH_ONLY` Coordinator contract:

- Profile: `revid-pm`; action marker: standalone `Action: REVIEW_DISPATCH_ONLY`.
- Read the revision 26 Task, PLAN, PROGRESS, REPORT, Executor card `t_9f24648e`, execution status and actual business diff.
- Create exactly one `revid-reviewer` card and one dependent `revid-pm` `HANDOFF_ONLY` card, then complete immediately.
- Use fresh idempotency keys ending in `:review-dispatch`, `:review:0` and `:handoff:0`; do not reuse revision 26 Dispatcher/Executor or any older card.
- Do not run tests, write project artifacts, modify business files or wait for Reviewer completion.

Independent Reviewer may create only:

- `ai/reviews/REVIEW-T4-002-UNIT-C2-REV26.md`

Reviewer must independently:

1. Run `py_compile` on both Allowed Files.
2. Run all four relevant `TestUnitB` selectors, including direct stale-same-only and mixed new/stale-same coverage.
3. Run AC1, AC2, AC3 and AC5 in the Task order against runtime `REVID_TEST_MYSQL_ADMIN_URL` and only `revid_test_t4_002`, with no skip or mock substitution for MySQL.
4. Audit that stale-same rows never enter INSERT, new rows insert once, stale-diff still aborts before writes, rollback behavior is unchanged, and `inserted` / `skipped` / `stale_same` / `stale_diff` / `errors` retain coherent meanings.
5. Reconcile the REPORT's command, pass/skip/mock, database identity and cleanup statements with fresh evidence and the actual diff.
6. Check secret exposure, Scope Drift and `git diff --check`.

Post-review `HANDOFF_ONLY` Coordinator may create only:

- `ai/handoffs/HANDOFF-T4-002-UNIT-C2-REV26-POST-REVIEW.md`

It may write that file only after Reviewer PASS and revision/attempt/card/evidence consistency checks. A Reviewer verdict of REWORK/BLOCKED, missing evidence or inconsistent evidence must block the HANDOFF stage.

Stop after canonical `UNIT_C2_HANDOFF_READY_REV26`; wait for Codex PMC final acceptance. This lifecycle continuation does not authorize Unit C3, Units D-E, T4-003 or T4-010.

## Revision 26r1 Terminal Runtime Closure

Coordinator `t_f46c8d6e` run `#126` timed out at `121s > 120s`, exhausted process retry `1/1` and created no Reviewer or HANDOFF child. Its persisted action was `DISPATCH_ONLY`, which conflicts with the authorized `REVIEW_DISPATCH_ONLY` lifecycle contract.

Revision `-26r1` is terminal `INFRASTRUCTURE_BLOCKED` and is no longer executable. Do not retry or reuse its card/key, and do not repeat revision `-26` business execution. Formal verdict: `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV26R1-2026-06-30.md`.

A fresh lifecycle continuation requires completed action-contract hardening, tests, isolated smokes and a runtime owner output of `READY_FOR_CONTINUATION`; no replacement Queue is authorized by this closure.
