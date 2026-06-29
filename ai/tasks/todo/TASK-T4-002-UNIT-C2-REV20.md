# TASK-T4-002-UNIT-C2-REV20 — Migration Core Continuation

## Status

`TERMINAL_INFRASTRUCTURE_BLOCKED — NOT EXECUTABLE`

## Revision

`phase4-wave2-unit-c2-migration-core-continuation-2026-06-28-20`

## Objective

在 ADR-003 授权的 disposable MySQL database 中，按固定顺序真实执行 migration core 四项验证，证明 dry-run、full migration、second-run idempotency 与 source immutability。

Revision `-19` 在 Executor dispatch 前因 Hermes worker terminal-finalization 缺陷终止；旧 chain 不得复用。该 runtime defect 已由 PMC 验收修复。Revision `-20` 是同一 business attempt 1 的新 bounded continuation，不是 attempt 2。

## Runtime Outcome

Coordinator `t_1617a921` run `#114` 在 121s 超过 120s limit，process retry `1/1` exhausted，且未创建 Executor。实际 card body 只有本 Task 的 `@path` 引用，缺少 standalone `Action: DISPATCH_ONLY`；worker policy 未激活，日志出现 allowlist 外工具。

Revision `-20` 已 terminal，不得复用、claim、promote、unblock 或 retry。正式 PMC verdict：`ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV20-2026-06-28.md`。

## Coordinator Contract

Hermes Supervisor 只创建一个新的 `revid-pm` Coordinator，card body 必须包含独立一行：

```text
Action: DISPATCH_ONLY
```

Coordinator 只允许：

1. 读取本 Task。
2. 创建且只创建一个 `revid-backend` Executor child。
3. 验证真实 card ID、assignee、parent 与 revision。
4. 立即完成 Coordinator。

禁止运行 tests、访问 database、写项目 artifact、创建 Reviewer/HANDOFF、等待 Executor、复用旧 card 或修改 business files。

## Scope

按下列顺序、在一次 `TestMigrationTool` class lifecycle 内执行现有 tests：

1. `TestMigrationTool::test_ac1_dry_run_no_changes`
2. `TestMigrationTool::test_ac2_full_migration_succeeds`
3. `TestMigrationTool::test_ac3_idempotency`
4. `TestMigrationTool::test_ac5_source_immutable`

允许 fixture 在唯一 database `revid_test_t4_002` 内创建 Alembic schema、清理 application table test rows、写入 fixture data、查询验证，并在结束时删除该 disposable database。

## Non-goals

- 不修改业务代码、migration 或 tests。
- 不执行 Unit C1、Unit C3、Unit D/E、T4-003 或 T4-010。
- 不执行 conflict、FK orphan、partial rollback、12-table consistency report 或 cleanup-failure injection tests。
- 不读取 `.env`，不使用 fallback credential，不接触 `revid_db` 或其他 database。

## Allowed Files

Executor 只允许创建：

- `ai/tasks/doing/TASK-T4-002-UNIT-C2-REV20-PLAN.md`
- `ai/tasks/doing/TASK-T4-002-UNIT-C2-REV20-PROGRESS.md`
- `ai/reports/REPORT-T4-002-UNIT-C2-REV20.md`

以下业务文件为 read-only：

- `backend/scripts/migrate_sqlite_to_mysql.py`
- `backend/tests/test_migration_tool.py`

Reviewer/HANDOFF 文件尚未授权。Executor 禁止创建 REVIEW 或 HANDOFF。

## Hard Gates

1. 只从 runtime environment 读取 `REVID_TEST_MYSQL_ADMIN_URL`；不得输出完整 URL、username、password 或 secret。
2. database name 必须在所有 write/delete/drop 前证明精确为 `revid_test_t4_002`。
3. destructive/data operations 仅限 `revid_test_t4_002`：CREATE/DROP database、Alembic schema、application table test-row DELETE/INSERT/SELECT。
4. 禁止对 `revid_db` 或任何其他 database 执行写入、DELETE、DROP、TRUNCATE、migration 或 cleanup。
5. secret 缺失、权限不足、identity 不明、cleanup 失败、test order 无法保证或存在未知 active chain 时立即 `BLOCKED`。
6. 禁止复用、claim、promote、unblock 或 retry 任何旧 T4-002 card。
7. Coordinator max runtime：120s；Executor max runtime：1800s。Coordinator 不得执行 Executor work。

## Verification

```powershell
python -m py_compile backend/scripts/migrate_sqlite_to_mysql.py
python -m py_compile backend/tests/test_migration_tool.py
python -m pytest backend/tests/test_migration_tool.py::TestMigrationTool::test_ac1_dry_run_no_changes backend/tests/test_migration_tool.py::TestMigrationTool::test_ac2_full_migration_succeeds backend/tests/test_migration_tool.py::TestMigrationTool::test_ac3_idempotency backend/tests/test_migration_tool.py::TestMigrationTool::test_ac5_source_immutable -q -p no:cacheprovider
git diff --check -- backend/scripts/migrate_sqlite_to_mysql.py backend/tests/test_migration_tool.py
```

## Acceptance Criteria

- 四个指定 tests 均实际执行且通过，不得 skip、mock MySQL 或替换为静态检查。
- dry-run 前后 `users` row count 不变。
- full migration 后 12 张 application tables 的 row counts 与 fixture 对应。
- second run 后 12 张表 row counts 不变。
- SQLite fixture 文件 size 在 read/migration path 前后不变。
- REPORT 明确记录 database identity、test order、passed/skipped 数量、12-table result、cleanup outcome 和 unverified items。
- allowed business file diff 为空，无 secret 泄露，无用户 database 写入。

## Failure Fingerprint Inheritance

继承 T4-002 截至 revision `-19` 的全部 business/runtime fingerprints，包括但不限于：

- `REV17_COORDINATOR_TIMEOUT`
- `REV17_COORDINATOR_RETRY_EXHAUSTED`
- `COORDINATOR_ROLE_COLLAPSE`
- `REV18_LIFECYCLE_STAGE_GAP`（已关闭但保留）
- `REV18_PREMATURE_HANDOFF_SCOPE_DRIFT`
- `REV19_COORDINATOR_CRASH`

Revision 变化不得清零任何 fingerprint。

## Stop Condition

生成 Unit C2 PLAN、PROGRESS、REPORT，Executor 进入 terminal review-required 后停止。不得创建 Reviewer 或 HANDOFF，等待 Codex PMC 审核并决定 lifecycle continuation。
