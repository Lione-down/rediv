# PLAN — T4-002 Unit C2 Revision 22

## Task
T4-002 / UNIT-C2 — Migration Core Child-Contract Correction (rev22)

## Revision
`phase4-wave2-unit-c2-child-contract-corrected-2026-06-29-22`

## Objective
在 disposable MySQL database `revid_test_t4_002` 中真实执行 migration core 四项验证：
1. `test_ac1_dry_run_no_changes` — dry-run 前后 users row count 不变
2. `test_ac2_full_migration_succeeds` — full migration 后 12 张表 row counts 与 fixture 对应
3. `test_ac3_idempotency` — second run 后 12 张表 row counts 不变
4. `test_ac5_source_immutable` — SQLite fixture 文件 size 不变

## Allowed Files
- **创建**: `ai/tasks/doing/TASK-T4-002-UNIT-C2-REV22-PLAN.md`
- **创建**: `ai/tasks/doing/TASK-T4-002-UNIT-C2-REV22-PROGRESS.md`
- **创建**: `ai/reports/REPORT-T4-002-UNIT-C2-REV22.md`
- **Read-only**: `backend/scripts/migrate_sqlite_to_mysql.py`
- **Read-only**: `backend/tests/test_migration_tool.py`

## Steps
1. **Environment Check** — 确认 `REVID_TEST_MYSQL_ADMIN_URL` 已设置，`pytest` 可用
2. **Syntax Validation** — `py_compile` 两个只读业务文件
3. **Run Four AC Tests** — 按 AC 顺序执行四个指定 tests
4. **Diff Verification** — `git diff --check` 确认无业务文件变更
5. **Report Generation** — 创建 REPORT，逐项对应 AC

## Verification Command
```
python -m pytest backend/tests/test_migration_tool.py::TestMigrationTool::test_ac1_dry_run_no_changes backend/tests/test_migration_tool.py::TestMigrationTool::test_ac2_full_migration_succeeds backend/tests/test_migration_tool.py::TestMigrationTool::test_ac3_idempotency backend/tests/test_migration_tool.py::TestMigrationTool::test_ac5_source_immutable -v
```

## Hard Gates
- 业务文件只读，禁止修改 `migrate_sqlite_to_mysql.py` 和 `test_migration_tool.py`
- 缺失 `REVID_TEST_MYSQL_ADMIN_URL` 则 BLOCKED，不得跳过或猜测
- 禁止创建 Reviewer 或 HANDOFF 卡片
