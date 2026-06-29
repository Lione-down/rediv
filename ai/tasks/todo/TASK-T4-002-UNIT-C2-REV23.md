# TASK-T4-002-UNIT-C2-REV23 — AC3 Stale-Same Idempotency Remediation

## Status

`TERMINAL_INFRASTRUCTURE_BLOCKED — NOT EXECUTABLE`

## Revision

`phase4-wave2-unit-c2-ac3-stale-same-remediation-2026-06-29-23`

## Authorization

Revision `-22` completed its read-only verification and is terminal `PMC_REWORK` with fingerprint `AC3_STALE_SAME_DUPLICATE_INSERT`. This revision changes Scope from verification-only to bounded business remediation; it must use fresh Coordinator/Executor cards and idempotency keys and inherits every historical T4-002 fingerprint.

## Objective

修复 `migrate_table()` 在 second run 时仍 INSERT `stale_same` rows 的缺陷，使迁移可重复执行，同时保持 same-PK different-value conflict fail-closed、transaction rollback 和 report semantics 不回归。

## Scope

- 在 `backend/scripts/migrate_sqlite_to_mysql.py` 中构造明确的 insert execution set，只写入 primary key 不存在于 target 的 rows。
- 必要时在 `backend/tests/test_migration_tool.py` 补充或强化 stale-same mixed/new-row regression coverage。
- 运行 targeted unit tests 与 ADR-003 disposable MySQL AC1/AC2/AC3/AC5 selectors。

## Non-goals

- 不修改 schema、Alembic migration、models、API、frontend 或 runtime configuration。
- 不改变 same-PK different-value conflict policy，不引入 `ON DUPLICATE KEY UPDATE`、silent overwrite 或 broad upsert。
- 不执行 Unit C3、Unit D/E、T4-003 或 T4-010。
- 不读取 `.env`，不接触 `revid_db` 或任何非 `revid_test_t4_002` database。

## Allowed Files

Executor 可修改：

- `backend/scripts/migrate_sqlite_to_mysql.py`
- `backend/tests/test_migration_tool.py`

Executor 可创建：

- `ai/tasks/doing/TASK-T4-002-UNIT-C2-REV23-PLAN.md`
- `ai/tasks/doing/TASK-T4-002-UNIT-C2-REV23-PROGRESS.md`
- `ai/reports/REPORT-T4-002-UNIT-C2-REV23.md`

Independent REVIEW 与 HANDOFF 不在本 execution stage 授权范围内；REPORT_READY 后由 PMC 发布 lifecycle continuation，不得再次保持无决策只读等待。

## Implementation Constraints

1. `stale_same` rows must not enter the INSERT loop.
2. New rows must still be inserted exactly once.
3. Any `stale_diff` row must abort before writes with a visible error.
4. Report fields `source_count`, `inserted`, `stale_same`, `stale_diff`, `errors` and checksum must preserve their defined meanings.
5. Do not solve the defect with exception swallowing, duplicate-key ignore, `INSERT IGNORE` or `ON DUPLICATE KEY UPDATE`.
6. Keep the change minimal and limited to the defect plus direct regression coverage.

## Hard Gates

1. Real MySQL tests may use only runtime `REVID_TEST_MYSQL_ADMIN_URL`; never print or persist the URL or credential.
2. Before every create/write/delete/drop operation, database identity must be exactly `revid_test_t4_002`.
3. Missing secret, insufficient permission, unknown identity, cleanup failure or conflicting business-file ownership means `BLOCKED`.
4. Do not reuse, claim, promote, unblock or retry revision `-22` or earlier cards.
5. Coordinator max runtime `120s`, dispatch-only. Executor max runtime `1800s`; at most one process retry.

## Exact Executor Child Contract

Coordinator must create exactly one `revid-backend` child whose persisted body states all of the following:

- Revision: `phase4-wave2-unit-c2-ac3-stale-same-remediation-2026-06-29-23`.
- Parent: current rev23 Coordinator.
- Idempotency: `revid:phase4-wave2-unit-c2-ac3-stale-same-remediation-2026-06-29-23:T4-002:execute:0`.
- Max runtime: `1800s`; at most one process retry under board policy.
- It may modify only the two Allowed business files and create only the three rev23 Executor artifacts.
- It must implement the bounded AC3 fix and run the Required Verification; business files are not read-only in rev23.
- It must not create Reviewer/HANDOFF or start any later Unit.

Coordinator must read the persisted child back and verify assignee, parent, revision, body, idempotency and runtime before completing. Any mismatch must block the child and Coordinator with a stable contract fingerprint; it must not claim dispatch success.

## Required Verification

Run from the project environment:

```powershell
python -m py_compile backend/scripts/migrate_sqlite_to_mysql.py backend/tests/test_migration_tool.py
python -m pytest backend/tests/test_migration_tool.py::TestUnitB::test_unit_b_ac10_stale_same_ok backend/tests/test_migration_tool.py::TestUnitB::test_unit_b_ac10_mixed_rows -q -p no:cacheprovider
python -m pytest backend/tests/test_migration_tool.py::TestMigrationTool::test_ac1_dry_run_no_changes backend/tests/test_migration_tool.py::TestMigrationTool::test_ac2_full_migration_succeeds backend/tests/test_migration_tool.py::TestMigrationTool::test_ac3_idempotency backend/tests/test_migration_tool.py::TestMigrationTool::test_ac5_source_immutable -q -p no:cacheprovider
git diff --check -- backend/scripts/migrate_sqlite_to_mysql.py backend/tests/test_migration_tool.py
```

If the exact mixed-row unit selector has a different existing name, resolve it by test collection and record the actual selector; do not silently skip the mixed stale-same/new-row regression.

## Acceptance Criteria

- AC3 real disposable-MySQL idempotency selector passes without duplicate-key error.
- AC1, AC2 and AC5 remain passing in the same ordered class lifecycle.
- Unit evidence proves stale-same-only and mixed new/stale-same rows do not insert existing rows.
- same-PK different-value conflict still aborts before writes and is not silently overwritten.
- Report counts remain accurate: inserted counts only new rows; stale_same counts identical existing rows.
- No secret leak, no unauthorized database access, no Scope Drift and `git diff --check` passes.
- REPORT accurately records commands, exit codes, passed/failed/skipped counts, cleanup result and unverified items.

## Failure Fingerprint Inheritance

Inherit all T4-002 business/runtime fingerprints through revision `-22`, including:

- `REV19_COORDINATOR_CRASH`
- `REV20_MISSING_ACTION_POLICY_BYPASS`
- `WINDOWS_CMD_MULTILINE_BODY_TRUNCATION`
- `REV21_COORDINATOR_CHILD_CONTRACT_INVALID`
- `AC3_STALE_SAME_DUPLICATE_INSERT`

Revision change does not clear any fingerprint.

## Stop Condition

Stop at `UNIT_C2_AC3_REMEDIATION_REPORT_READY_REV23`. Executor must not create REVIEW, HANDOFF or another worker. The next PMC cycle must either publish `REVIEW_DISPATCH_ONLY` lifecycle continuation when the REPORT is complete and passing, or issue a bounded REWORK/BLOCKED verdict when it is not.

## Runtime Outcome and PMC Closure

- Coordinator `t_1dea37a2` run `#120` failed before worker spawn with `MISSING_WORKER_ACTION_MARKER`; no Executor or business artifacts exist.
- Raw cron evidence proves Supervisor explicitly created the card with `--body "@ai/tasks/todo/TASK-T4-002-UNIT-C2-REV23.md"` after an unsafe Bash→PowerShell command failed. This was not CLI truncation of a complete body.
- Runtime fix and verdict: `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV23-2026-06-29.md`.
- Revision `-23` and card `t_1dea37a2` are terminal evidence. Do not delete, archive, retry, unblock or reuse them.
- Business Scope continues only through revision `-24` with fresh idempotency keys.
