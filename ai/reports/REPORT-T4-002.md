# REPORT-T4-002: SQLite → MySQL 数据迁移工具

## 任务概述
T4-002: 提供可 dry-run、可重复执行、可验证的 ETL 工具，将 revid.db 的现有数据迁
移到由 Alembic 创建的 MySQL schema。

## 修改文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `backend/scripts/migrate_sqlite_to_mysql.py` | 新增 | CLI 迁移脚本 (647 行) |
| `backend/tests/test_migration_tool.py` | 新增 | 18 个单元测试 |
| `backend/scripts/migrate_sqlite_to_mysql.py` | 修复 | FK 孤儿检测中 ref_col 解析 bug |

## 命令结果

### 1. 单元测试
```
Ran 18 tests in 0.121s
OK
```

### 2. Dry-run 验证
```
Mode: DRY-RUN
[1/4] Reading SQLite database...
  users: 2 rows, store_configs: 1, quotas: 2, projects: 2, identities: 1,
  guests: 4, invitation_codes: 1, canvas_nodes: 1, assets: 1,
  templates: 1, quota_ledger: 7, admin_logs: 11
[3/4] Migrating data... (all 12 tables, 34 rows total, 0 errors)
[Dry-run] No data was written to MySQL.
```

### 3. Execute 验证（第一次）
```
Mode: EXECUTE
[3/4] Migrating data... (all 12 tables, 34 inserted, 0 skipped, 0 errors)
[4/4] Validating migration... PASSED
Totals: inserted=34 skipped=0 errors=0
```

### 4. Execute 验证（第二次 — 幂等性）
```
Mode: EXECUTE
[3/4] Migrating data... (all 12 tables, 0 inserted, 34 skipped, 0 errors)
[4/4] Validating migration... PASSED
Checksums identical across both runs.
```

### 5. MySQL 数据验证
```
users: 2, store_configs: 1, quotas: 2, projects: 2, identities: 1,
guests: 4, invitation_codes: 1, canvas_nodes: 1, assets: 1,
templates: 1, quota_ledger: 7, admin_logs: 11
```

### 6. 原始 revid.db 完整性
- `backend/revid.db`: 221184 bytes, 6月 22 14:00 — 未修改
- `revid.db`: 212992 bytes, 6月 20 17:48 — 未修改

### 7. 编译检查
```
python -m compileall scripts/migrate_sqlite_to_mysql.py tests/test_migration_tool.py
Exit code: 0 (PASS)
```

## Bug 修复
在 `MigrationValidator.validate()` 中，FK 孤儿检测的 `ref.split("(")` 无法正确处理
`users(id)` 格式的引用（产生 `ref_col = "id)"` 而非 `"id"`）。已修复为使用
`partition("(")` + `rstrip(")")`。

## Acceptance Criteria 验收

| # | 标准 | 状态 | 证据 |
|---|------|------|------|
| 1 | dry-run 不改变 MySQL 数据 | ✅ PASS | Dry-run 模式下 MySQL 数据不变，输出 "[Dry-run] No data was written" |
| 2 | 临时 SQLite/MySQL 测试数据上完整迁移成功 | ✅ PASS | Execute 模式 12 张表 34 行全部迁移成功 |
| 3 | 连续执行两次后 row count 和业务值保持不变 | ✅ PASS | 第二次 execute: 0 inserted, 34 skipped, checksums identical |
| 4 | 人为制造外键孤儿或重复冲突时脚本失败 | ⚠️ PARTIAL | 重复冲突通过 ON DUPLICATE KEY UPDATE 正确处理（跳过）；FK 孤儿检测在 validate() 中实现但未在任务专项测试中覆盖 |
| 5 | 原始 revid.db 未被覆盖或删除 | ✅ PASS | 两个 revid.db 文件时间戳和大小均未变化 |
| 6 | 迁移报告证明 12 张表数据一致 | ✅ PASS | Validation 阶段逐表对比 row count、PK 集合、FK 引用 |

## 风险和回滚方式
- **风险**: 迁移脚本的 `ensure_schema()` 会在表不存在时 CREATE TABLE，但如果 Alembic 
  已创建了表，脚本不会覆盖已有结构。
- **回滚**: 迁移工具本身不提供反向迁移。如需回滚，直接 DROP TABLE 或用 Alembic downgrade。
- **安全**: 密码通过 `_redact_sensitive()` 遮蔽；CLI 默认 dry-run，需显式 `--execute`。
