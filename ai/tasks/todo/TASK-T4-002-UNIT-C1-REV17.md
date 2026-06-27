# Task: T4-002 Unit C1 — disposable MySQL fixture preflight

## Execution Identity

- Parent Task: `T4-002`
- Work Unit: `UNIT-C1`
- Queue Revision: `phase4-wave2-unit-c1-fixture-preflight-2026-06-27-17`
- Business Attempt: `1 continuation`（不是 attempt 2）
- Executor: `revid-backend`
- Reviewer: `revid-reviewer`

## Objective

在 ADR-003 边界内完成最小真实 MySQL preflight：证明专用测试库连接、精确 database identity、Alembic 12-table schema 创建和 cleanup 可用，为后续 Unit C2/C3 提供执行前提。

## Scope

只执行现有 integration tests：

- `TestMigrationTool::test_ac8_structured_url_and_identity`
- `TestMigrationTool::test_ac9_alembic_creates_schema`

允许测试 fixture 在一次 test class lifecycle 内创建、使用并删除唯一数据库 `revid_test_t4_002`。

## Non-goals

- 不修改业务代码、migration 或 tests。
- 不执行 full migration、dry-run、second-run、conflict、rollback 或 consistency tests。
- 不执行 Unit C2/C3、Unit D/E、T4-003 或 T4-010。
- 不读取 `.env`，不使用 fallback credential，不接触 `revid_db` 或其他数据库。

## Allowed Files

只允许创建当前 revision 的 Executor artifacts：

- `ai/tasks/doing/TASK-T4-002-UNIT-C1-REV17-PLAN.md`
- `ai/tasks/doing/TASK-T4-002-UNIT-C1-REV17-PROGRESS.md`
- `ai/reports/REPORT-T4-002-UNIT-C1-REV17.md`

Independent Reviewer 只允许创建：

- `ai/reviews/REVIEW-T4-002-UNIT-C1-REV17.md`

Coordinator 只允许创建：

- `ai/handoffs/HANDOFF-T4-002-UNIT-C1-REV17.md`

`backend/scripts/migrate_sqlite_to_mysql.py` 与 `backend/tests/test_migration_tool.py` 本 revision 为 read-only。

## Hard Gates

1. 只从 runtime environment 读取 `REVID_TEST_MYSQL_ADMIN_URL`；不得输出完整 URL、username、password 或 secret。
2. destructive operation 仅限 `CREATE DATABASE revid_test_t4_002` 与 `DROP DATABASE revid_test_t4_002`。
3. 执行前后必须证明 database name 精确为 `revid_test_t4_002`。
4. schema 必须由 Alembic `upgrade head` 创建，并证明 12 张 application tables 存在。
5. secret 缺失、权限不足、identity 不明、cleanup 失败或存在未知 active chain 时立即 `BLOCKED`。
6. 禁止复用、claim、promote、unblock 或 retry `t_aeaefef4` 及任何旧 card。

## Verification

```powershell
python -m py_compile backend/scripts/migrate_sqlite_to_mysql.py
python -m py_compile backend/tests/test_migration_tool.py
python -m pytest backend/tests/test_migration_tool.py::TestMigrationTool::test_ac8_structured_url_and_identity backend/tests/test_migration_tool.py::TestMigrationTool::test_ac9_alembic_creates_schema -q -p no:cacheprovider
git diff --check -- backend/scripts/migrate_sqlite_to_mysql.py backend/tests/test_migration_tool.py
```

## Acceptance Criteria

- 两个指定 tests 均实际执行且通过，不得 skip、mock MySQL 或替换为静态检查。
- test database identity、Alembic 12-table schema 与 cleanup 结果在 REPORT 中明确记录。
- REPORT、Independent REVIEW、HANDOFF 均属于 revision `-17` / Unit C1 / attempt 1 continuation。
- allowed business file diff 为空，无 secret 泄露，无用户数据库写入。

## Failure Fingerprint Inheritance

继承 T4-002 截至 revision `-16` 的全部 business/runtime fingerprints；完整集合以 `ai/tasks/todo/TASK-T4-002.md`、Queue revision `-16` 历史和 `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV16-2026-06-26.md` 为 canonical evidence。新增且不得清零：

- `REV16_COORDINATOR_TIMEOUT`
- `REV16_COORDINATOR_RETRY_EXHAUSTED`

## Stop Condition

生成 Unit C1 REPORT、Independent REVIEW 与 `UNIT_C1_HANDOFF_READY_REV17` 后停止，等待 Codex PMC 最终验收。
