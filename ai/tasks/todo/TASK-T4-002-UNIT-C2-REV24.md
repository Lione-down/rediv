# TASK-T4-002-UNIT-C2-REV24 — AC3 Remediation with Fixed Coordinator Transport

## Status

`APPROVED — EXECUTABLE`

## Revision

`phase4-wave2-unit-c2-ac3-stale-same-remediation-transport-fixed-2026-06-29-24`

## Authorization

Revision `-23` ended before Executor dispatch due Supervisor shell-boundary failure. Its business Objective, Scope, Non-goals, Allowed Files, Implementation Constraints, Hard Gates, Required Verification and Acceptance Criteria remain unchanged and are incorporated from `TASK-T4-002-UNIT-C2-REV23.md`.

Revision `-24` is a clean runtime continuation with fresh cards/keys, not a business retry and not an attempt to clear any fingerprint.

## Objective

Fix `migrate_table()` so identical existing `stale_same` rows never enter the INSERT execution set, while preserving same-PK different-value fail-closed behavior, rollback and report semantics.

## Allowed Files

Executor may modify only:

- `backend/scripts/migrate_sqlite_to_mysql.py`
- `backend/tests/test_migration_tool.py`

Executor may create only:

- `ai/tasks/doing/TASK-T4-002-UNIT-C2-REV24-PLAN.md`
- `ai/tasks/doing/TASK-T4-002-UNIT-C2-REV24-PROGRESS.md`
- `ai/reports/REPORT-T4-002-UNIT-C2-REV24.md`

## Runtime Transport Gate

Supervisor must create the Coordinator only through:

`ai/runtime/create-hermes-coordinator.py`

Required Coordinator values:

- Revision: `phase4-wave2-unit-c2-ac3-stale-same-remediation-transport-fixed-2026-06-29-24`
- Task: `T4-002`
- Task path: `ai/tasks/todo/TASK-T4-002-UNIT-C2-REV24.md`
- Executor profile: `revid-backend`
- Coordinator idempotency: `revid:phase4-wave2-unit-c2-ac3-stale-same-remediation-transport-fixed-2026-06-29-24:T4-002:coordinate`
- Coordinator runtime: `120s`

The launcher must return JSON whose persisted body exactly matches its canonical body. Any launcher failure or mismatch means `INFRASTRUCTURE_BLOCKED`; do not fall back to direct shell `--body`, `@Task`-only body, old card reuse or another key under revision `-24`.

## Exact Executor Child Contract

Coordinator creates exactly one `revid-backend` child:

- Parent: current rev24 Coordinator.
- Idempotency: `revid:phase4-wave2-unit-c2-ac3-stale-same-remediation-transport-fixed-2026-06-29-24:T4-002:execute:0`.
- Max runtime: `1800s`; at most one process retry.
- Body: revision/task path, two writable business files, three allowed rev24 artifacts, required verification, ADR-003 gates and prohibition on Reviewer/HANDOFF.

Coordinator must read the child back and verify assignee, parent, revision, body, idempotency and runtime before completing. Mismatch means `COORDINATOR_CHILD_CONTRACT_INVALID` and must not execute.

## Required Verification

```powershell
python -m py_compile backend/scripts/migrate_sqlite_to_mysql.py backend/tests/test_migration_tool.py
python -m pytest backend/tests/test_migration_tool.py::TestUnitB::test_unit_b_ac10_stale_same_ok backend/tests/test_migration_tool.py::TestUnitB::test_unit_b_ac10_mixed_rows -q -p no:cacheprovider
python -m pytest backend/tests/test_migration_tool.py::TestMigrationTool::test_ac1_dry_run_no_changes backend/tests/test_migration_tool.py::TestMigrationTool::test_ac2_full_migration_succeeds backend/tests/test_migration_tool.py::TestMigrationTool::test_ac3_idempotency backend/tests/test_migration_tool.py::TestMigrationTool::test_ac5_source_immutable -q -p no:cacheprovider
git diff --check -- backend/scripts/migrate_sqlite_to_mysql.py backend/tests/test_migration_tool.py
```

Real MySQL verification may use only runtime `REVID_TEST_MYSQL_ADMIN_URL` and database `revid_test_t4_002`. Never read `.env`, print credentials or touch `revid_db`.

## Acceptance Criteria

- Unit evidence passes for stale-same-only and mixed new/stale-same rows.
- Real disposable-MySQL AC1/AC2/AC3/AC5 all pass in fixed order; no skip/mock substitution.
- Existing identical rows are not inserted; new rows insert once; stale-diff aborts before writes.
- Report counts preserve inserted/stale_same/stale_diff/error meaning.
- No secret leak, unauthorized database access, Scope Drift or unknown business-file ownership.
- REPORT records exact commands, exit codes, pass/fail/skip counts, cleanup and unverified items.

## Failure Fingerprint Inheritance

Inherit all T4-002 fingerprints through revision `-23`, including:

- `REV20_MISSING_ACTION_POLICY_BYPASS`
- `WINDOWS_CMD_MULTILINE_BODY_TRUNCATION` (historical label; rev23 raw evidence refines the active cause)
- `REV21_COORDINATOR_CHILD_CONTRACT_INVALID`
- `AC3_STALE_SAME_DUPLICATE_INSERT`
- `REV23_COORDINATOR_MISSING_ACTION_MARKER`
- `SUPERVISOR_BASH_POWERSHELL_VARIABLE_EXPANSION_AND_UNAUTHORIZED_FALLBACK`

## Stop Condition

Stop at `UNIT_C2_AC3_REMEDIATION_REPORT_READY_REV24`. Executor must not create Reviewer/HANDOFF. At REPORT_READY, PMC must issue review lifecycle continuation for a passing REPORT or a bounded REWORK/BLOCKED decision for failure.
