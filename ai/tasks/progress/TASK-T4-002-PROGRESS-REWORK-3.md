# PLAN: T4-002 REWORK — Disposable MySQL Integration Tests

## Task ID
T4-002 (REWORK wave2)

## Date
2026-06-23

## Objective
修复 integration tests 可移植性，使用专用 disposable MySQL test database 完成端到端验收。

## PMC REWORK Reasons (from CURRENT.md)
1. Integration tests 路径不可移植
2. 未隔离 disposable MySQL test database
3. 缺少 execute、幂等、冲突/FK、rollback、12-table consistency 验证

## Changes

### 1. 拆分 missing-source test
- 将 `test_missing_source_returns_nonzero` 移出 `MySQLIntegrationTests`
- 放入独立的 `MissingSourceTests` 类
- 不依赖 MySQL credentials，不因 password gate 被 skip

### 2. 创建 DisposableMySQLTests 类
- 使用 `REVID_TEST_MYSQL_ADMIN_URL` (如果设置) 或本地 MySQL root/root123
- 每次测试前创建专用数据库 `revid_test_t4_002`
- 在专用数据库上创建 12 张表（使用 Alembic migration 或手动 DDL）
- 测试完成后 DROP DATABASE
- 覆盖: execute、幂等、FK 孤儿检测、rollback、12-table consistency

### 3. 新增测试用例
- `test_execute_full_migration`: 完整 12 表迁移
- `test_idempotency_second_run`: 第二次执行 0 inserted
- `test_fk_orphan_detection`: 验证 FK 孤儿检测
- `test_rollback_on_conflict`: 验证 FK 冲突时回滚
- `test_12_table_consistency`: 验证所有 12 张表数据一致

### 4. 路径可移植性
- 所有路径使用 `Path(__file__).resolve().parent` 解析
- 无硬编码绝对路径

## Files to Modify
1. `backend/tests/test_migration_tool.py` — 拆分测试类，新增 disposable MySQL tests
2. `backend/tests/conftest.py` — 如需全局 fixture

## Stop Conditions
- `REVID_TEST_MYSQL_ADMIN_URL` 缺失且本地 MySQL 不可用 → BLOCKED
