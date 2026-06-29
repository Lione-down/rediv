# PLAN — T4-002 Unit C2 Revision 21

## Task
T4-002 / UNIT-C2 — Migration Core Continuation (policy-handoff-fixed)

## Revision
`phase4-wave2-unit-c2-migration-core-policy-handoff-fixed-2026-06-29-21`

## Objective
在 disposable MySQL database `revid_test_t4_002` 中真实执行 migration core 四项验证：
1. `test_ac1_dry_run_no_changes` — dry-run 前后 users row count 不变
2. `test_ac2_full_migration_succeeds` — full migration 后 12 张表 row counts 与 fixture 对应
3. `test_ac3_idempotency` — second run 后 12 张表 row counts 不变
4. `test_ac5_source_immutable` — SQLite fixture 文件 size 不变

## Allowed Files
- **创建**: `ai/tasks/doing/TASK-T4-002-UNIT-C2-REV21-PLAN.md`
- **创建**: `ai/tasks/doing/TASK-T4-002-UNIT-C2-REV21-PROGRESS.md`
- **创建**: `ai/reports/REPORT-T4-002-UNIT-C2-REV21.md`
- **Read-only**: `backend/scripts/migrate_sqlite_to_mysql.py`
- **Read-only**: `backend/tests/test_migration_tool.py`

## Steps
1. **Environment Check** — 确认 `REVID_TEST_MYSQL_ADMIN_URL` 已设置，`pytest` 可用，虚拟环境存在
2. **Syntax Validation** — `py_compile` 两个只读业务文件
3. **Run Four AC Tests** — 按 AC 顺序执行四个指定 tests
4. **Diff Verification** — `git diff --check` 确认无业务文件变更
5. **Report Generation** — 创建 REPORT，逐项对应 AC

## Verification Command
```
python -m pytest backend/tests/test_migration_tool.py::TestMigrationTool::test_ac1_dry_run_no_changes backend/tests/test_migration_tool.py::TestMigrationTool::test_ac2_full_migration_succeeds backend/tests/test_migration_tool.py::TestMigrationTool::test_ac3_idempotency backend/tests/test_migration_tool.py::TestMigrationTool::test_ac5_source_immutable -q -p no:cacheprovider
```

## Hard Gates
- 只读取 `REVID_TEST_MYSQL_ADMIN_URL`，不输出 secret
- Database 必须是 `revid_test_t4_002`
- 不修改任何业务文件
- 不访问 `revid_db` 或其他数据库
- 不创建 Reviewer 或 HANDOFF

## Risk Assessment
- MySQL 连接超时或权限不足 → BLOCKED
- 旧 test DB 残留导致 fixture 冲突 → `_setup_test_db` 会先 cleanup
- pytest 依赖缺失 → 使用项目 venv
