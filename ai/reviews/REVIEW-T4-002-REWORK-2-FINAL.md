# REVIEW-T4-002-REWORK-2-FINAL — DDL JSON DEFAULT Fix Verification

## Task ID
T4-002 — T4-002 REVIEW: DDL JSON DEFAULT fix verification (post-wave2 rework)

## Reviewer
Independent Reviewer (revid-reviewer)

## Review Date
2026-06-23

## Wave
phase4-wave2-rework-2026-06-23-02

## Parent Executor Card
t_b1cd9959 (T4-002 DDL fix — already done)

---

## Verdict: PASS

All 34 tests pass (independently verified). The DDL JSON DEFAULT syntax fix in
`test_migration_tool.py` has been applied correctly. All 5 DisposableMySQLTests
now execute successfully against MySQL 8.0.43 STRICT mode.

---

## Scope Audit

| Item | Status |
|------|--------|
| 修改范围是否在声明范围内 | PASS — 仅修改了 test_migration_tool.py 的 DDL 子句 |
| 是否覆盖用户已有工作 | PASS — 无覆盖 |
| 是否引入未批准 dependency | PASS — 无新 dependency |
| 敏感信息泄露 | PASS — 无 hardcoded secret |
| destructive 操作 | PASS — 无 drop/truncate/reset |

---

## Acceptance Criteria Evidence

### AC1: 所有 34 个测试 PASS
**结果: PASS**

独立复跑命令:
```
cd /d/works/codexWorks/project_revid/backend && python -m unittest tests.test_migration_tool -v
```

实际输出: `Ran 34 tests in 5.922s — OK`

全部 34 个测试通过，0 errors, 0 skips:

| 测试类 | 测试数 | 结果 |
|--------|--------|------|
| SafeConversionTests | 10 | PASS |
| SQLiteReaderTests | 4 | PASS |
| TableOrderTests | 2 | PASS |
| SchemaOwnershipTests | 3 | PASS |
| TransactionTests | 2 | PASS |
| StaleValueDetectionTests | 1 | PASS |
| ValidatorTests | 4 | PASS |
| DryRunIntegrationTests | 2 | PASS |
| MissingSourceTests | 1 | PASS |
| DisposableMySQLTests | 5 | PASS |
| **合计** | **34** | **OK** |

### AC2: 无 MySQL connection errors
**结果: PASS**

所有 5 个 DisposableMySQLTests 成功执行:
- `test_execute_full_migration` — OK (12 tables, 15 rows migrated)
- `test_second_run_idempotency` — OK (0 inserted on second run, 15 stale)
- `test_fk_orphan_detection` — OK (non-zero exit for FK violation)
- `test_rollback_on_partial_failure` — OK (clean rollback)
- `test_12_table_consistency` — OK (row counts match across all 12 tables)

### AC3: DDL 修复仅限于 test_migration_tool.py 的 JSON DEFAULT 子句
**结果: PASS**

验证了 `_CREATE_TABLES_SQL` 中 4 处 JSON 列的 DEFAULT 已修复:

| Line | Table | Column | Syntax |
|------|-------|--------|--------|
| 632 | guests | local_project_snapshot | `DEFAULT (CAST('{}' AS JSON))` |
| 666 | canvas_nodes | content | `DEFAULT (CAST('{}' AS JSON))` |
| 708 | templates | node_data | `DEFAULT (CAST('[]' AS JSON))` |
| 741 | admin_logs | detail | `DEFAULT (CAST('{}' AS JSON))` |

迁移脚本 TABLE_DEFS 使用等效的 `json('{}')` 函数语法，两者在 MySQL 8.0+ 中等价。

---

## Commands Rerun

| Command | Expected | Actual | Status |
|---------|----------|--------|--------|
| `python -m unittest tests.test_migration_tool -v` | 34 passed | 34 passed, 0 errors, 0 skips | PASS |
| `python -m compileall ...` | exit 0 | exit 0 | PASS |
| `grep ensure_schema scripts/...` | 0 matches | 0 matches | PASS |
| `grep check_schema_exists scripts/...` | >0 matches | 2 matches | PASS |
| `grep "DEFAULT.*json\|DEFAULT.*CAST" tests/...` | 4 JSON DEFAULT fixes | 4 matches (lines 632,666,708,741) | PASS |

---

## Manual Evidence Checked

1. **test_migration_tool.py** (1125 lines): 确认 4 处 `_CREATE_TABLES_SQL` JSON DEFAULT 已使用 `(CAST(... AS JSON))` 语法；确认 `_sqlite_compat_ddl()` 正则能正确剥离该语法用于 SQLite。
2. **migrate_sqlite_to_mysql.py** (828 lines): 确认 TABLE_DEFS 中 4 处 JSON DEFAULT 使用 `json('{}')` 函数语法；确认无 `ensure_schema()` 方法；确认有 `check_schema_exists()`。
3. **Duplicate method**: 发现 `test_dry_run_count_matches` 定义了两遍 (lines 498, 509)，内容完全相同，第二遍覆盖第一遍。不影响功能，但属代码异味。
4. **Duplicate imports**: 发现 `import json` 和 `import os` 各出现两次 (lines 9/11, 10/12)。不影响功能，但属代码异味。

---

## Security / Data Findings

- 密码脱敏: `_redact_sensitive()` 正确处理 mysql:// URL 格式
- 无 hardcoded secret / credential
- 源数据库保护: `main()` 在读取前后检查 mtime，异常则 abort
- 安全门: CLI 默认 dry-run，`--execute` 需显式指定
- 生产 DB 警告: `revid.db` 路径含警告但不阻止执行
- MissingSourceTests 独立于 MySQL 凭据

---

## Required Fixes

无阻塞性问题。以下为建议改进项（不阻塞 PASS）:

### Minor: Duplicate imports (LOW)
Lines 9-12 中 `import json` 和 `import os` 各出现两次。建议清理。

### Minor: Duplicate test method (LOW)
`test_dry_run_count_matches` 在 lines 498 和 509 定义了两次，内容相同。
建议删除重复定义。

---

## Residual Risks

- **低风险**: 重复的 import 和 test 方法不影响功能，但降低了代码可读性。
- **低风险**: `_sqlite_compat_ddl()` 的正则 `[^']*` 只匹配单引号不含转义的场景，对于包含单引号的 JSON 内容可能不够健壮（但实际数据中几乎不会出现）。

---

## Files Reviewed

- `backend/scripts/migrate_sqlite_to_mysql.py` (828 lines)
- `backend/tests/test_migration_tool.py` (1125 lines)
- `ai/reports/REPORT-T4-002-REWORK.md` (executor report)
- `ai/reviews/REVIEW-T4-002-REWORK.md` (previous review)
- `ai/reviews/REVIEW-T4-002-REWORK-2.md` (previous review — identified the DDL fix)

---

## PMC Handoff

T4-002 DDL JSON DEFAULT 修复已验证通过。34 个测试全部 PASS（含 5 个 DisposableMySQLTests），
编译通过，无 MySQL connection errors。建议后续清理重复 import 和重复 test 方法。

*Reviewer: revid-reviewer | 2026-06-23 | No business code modified*
