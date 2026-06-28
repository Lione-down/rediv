# Task: T4-002 Unit C2 — disposable MySQL migration core verification

## Execution Identity

- Parent Task: `T4-002`
- Work Unit: `UNIT-C2`
- Queue Revision: `phase4-wave2-unit-c2-migration-core-2026-06-28-19`
- Business Attempt: `1 continuation`（不是 attempt 2）
- Executor: `revid-backend`
- Reviewer: `revid-reviewer`（REPORT_READY 后由单独 lifecycle continuation 批准）

## Objective

在 ADR-003 隔离边界内验证迁移核心正向路径：dry-run 不写入、12 表 full migration、second-run row-count idempotency，以及 SQLite fixture size 不变。

## Coordinator Contract

- Coordinator card body 必须包含独立一行 `Action: DISPATCH_ONLY`。
- Coordinator profile：`revid-pm`；max runtime：120s。
- Runtime exact allowlist：`read_file`、`kanban_show`、`kanban_create`、`kanban_link`、`kanban_complete`、`kanban_block`、`kanban_comment`、`kanban_heartbeat`。
- Coordinator 只创建一个 `revid-backend` Executor child，验证真实 card ID、parent、assignee、revision 后立即完成。
- Coordinator 禁止运行 tests、访问数据库、写项目 artifact、创建 Reviewer/HANDOFF 或等待 Executor。
- 缺少 exact action marker、tool policy 未生效或出现非 allowlist tool 时立即 infrastructure blocked。

本 revision 的 Stop After 是 `UNIT_C2_REPORT_READY_REV19`。Independent REVIEW 与 HANDOFF 必须等待 PMC 检查 REPORT 后另行批准 lifecycle continuation；不得由 Executor 提前创建。

## Scope

按下列顺序、在一次 `TestMigrationTool` class lifecycle 内执行现有 tests：

1. `TestMigrationTool::test_ac1_dry_run_no_changes`
2. `TestMigrationTool::test_ac2_full_migration_succeeds`
3. `TestMigrationTool::test_ac3_idempotency`
4. `TestMigrationTool::test_ac5_source_immutable`

允许 fixture 在唯一数据库 `revid_test_t4_002` 内创建 Alembic schema、清理 application table test rows、写入 fixture data、查询验证，并在结束时删除该 disposable database。

## Non-goals

- 不修改业务代码、migration 或 tests。
- 不执行 Unit C1、Unit C3、Unit D/E、T4-003 或 T4-010。
- 不执行 conflict、FK orphan、partial rollback、12-table consistency report 或 cleanup-failure injection tests。
- 不读取 `.env`，不使用 fallback credential，不接触 `revid_db` 或其他数据库。

## Allowed Files

Executor 只允许创建：

- `ai/tasks/doing/TASK-T4-002-UNIT-C2-REV19-PLAN.md`
- `ai/tasks/doing/TASK-T4-002-UNIT-C2-REV19-PROGRESS.md`
- `ai/reports/REPORT-T4-002-UNIT-C2-REV19.md`

`backend/scripts/migrate_sqlite_to_mysql.py` 与 `backend/tests/test_migration_tool.py` 本 revision 为 read-only。

Reviewer/HANDOFF 文件尚未授权。Executor 禁止创建 REVIEW 或 HANDOFF。

## Hard Gates

1. 只从 runtime environment 读取 `REVID_TEST_MYSQL_ADMIN_URL`；不得输出完整 URL、username、password 或 secret。
2. database name 必须在所有 write/delete/drop 前证明精确为 `revid_test_t4_002`。
3. destructive/data operations 仅限 `revid_test_t4_002`：CREATE/DROP database、Alembic schema、application table test-row DELETE/INSERT/SELECT。
4. 禁止对 `revid_db` 或任何其他 database 执行写入、DELETE、DROP、TRUNCATE、migration 或 cleanup。
5. secret 缺失、权限不足、identity 不明、cleanup 失败、test order 无法保证或存在未知 active chain 时立即 `BLOCKED`。
6. 禁止复用、claim、promote、unblock 或 retry 任何旧 T4-002 card。
7. Executor max runtime：1800s；不得由 Coordinator budget 覆盖 Executor work。

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
- allowed business file diff 为空，无 secret 泄露，无用户数据库写入。

## Failure Fingerprint Inheritance

继承 T4-002 截至 revision `-18r1` 的全部 business/runtime fingerprints，包括但不限于：

- `REV17_COORDINATOR_TIMEOUT`
- `REV17_COORDINATOR_RETRY_EXHAUSTED`
- `COORDINATOR_ROLE_COLLAPSE`
- `THIN_DISPATCHER_REMEDIATION_GATE_FAILED`
- `REV18_LIFECYCLE_STAGE_GAP`（已关闭但不得删除）
- `REV18_PREMATURE_HANDOFF_SCOPE_DRIFT`

Revision 变化不得清零任何 fingerprint。

## Stop Condition

生成 Unit C2 PLAN、PROGRESS、REPORT，Executor 进入 terminal review-required 后停止。不得创建 Reviewer 或 HANDOFF，等待 Codex PMC 审核并决定 lifecycle continuation。
