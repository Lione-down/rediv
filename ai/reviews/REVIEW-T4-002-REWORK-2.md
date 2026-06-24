# REVIEW-T4-002-REWORK-2 — SQLite to MySQL Migration Tool Wave 2 Rework

## Task ID
T4-002 — T4-002 REVIEW: independently verify migration rework (wave2 rework-2026-06-23-02)

## Reviewer
Independent Reviewer (revid-reviewer)

## Review Date
2026-06-23

## Wave
phase4-wave2-rework-2026-06-23-02

---

## Verdict: REWORK

REPORT-T4-002-REWORK.md 声称 3 个 MySQL 集成测试 "全部通过"，但独立复跑证实：**5 个 DisposableMySQLTests 全部在 setUp 阶段因 DDL 语法错误而 ERROR 退出**，迁移脚本从未被执行。REPORT 中的 "3 passed" 结论不可验证，属于虚假报告。

此外，REPORT 声称 "31 passed, 0 skipped" 的 pytest 汇总结果与实际 unittest 输出不一致（实际为 28 passed + 3 skipped + 5 errors）。

---

## Scope Audit

| Item | Status |
|------|--------|
| 修改范围是否在声明范围内 | PASS — 仅修改了 migrate_sqlite_to_mysql.py 和 test_migration_tool.py |
| 是否覆盖用户已有工作 | PASS — 无覆盖 |
| 是否引入未批准 dependency | PASS — 仅使用 sqlalchemy（原有依赖） |
| 敏感信息泄露 | PASS — 密码脱敏逻辑 _redact_sensitive() 正常工作 |
| destructive 操作 | PASS — 无 drop/truncate/reset |
| revid.db 完整性 | N/A — 本次审查不涉及源数据库 |

---

## Acceptance Criteria Evidence

### AC1: 28 个单元测试全部 PASS
**结果: PASS**

独立复跑命令:
```
cd backend && python -m unittest tests.test_migration_tool -v
```

实际输出: Ran 34 tests in 1.378s — 28 passed (unit), 5 errors (DisposableMySQLTests), 1 passed (MissingSourceTests)

28 个非-MySQL 测试全部通过，与 REPORT 一致。

### AC2: MySQL 集成测试 (execute, idempotency, missing-source)
**结果: REWORK**

REPORT 声称 "3 MySQL integration tests now pass"，但独立复跑显示:

- `test_execute_full_migration` — ERROR: `JSON column 'local_project_snapshot' can't have a default value` (MySQL 8.0.43 STRICT mode)
- `test_second_run_idempotency` — ERROR: 同上
- `test_fk_orphan_detection` — ERROR: 同上
- `test_rollback_on_partial_failure` — ERROR: 同上
- `test_12_table_consistency` — ERROR: 同上

根因: test_migration_tool.py 中 `_CREATE_TABLES_SQL` 列表的 DDL 使用了 `'{}'` / `'[]'` 字符串字面量作为 JSON 列的 DEFAULT，而非 MySQL 要求的 `json('{}')` / `json('[]')` 函数语法。

对比:
- 迁移脚本 TABLE_DEFS (第 99/127/167/198 行) 使用正确的 `NOT NULL DEFAULT (json('{}'))` 语法
- 测试 DDL (第 628/662/704/737 行) 使用错误的 `JSON NOT NULL DEFAULT '{}'` 语法

MissingSourceTests 是独立的 top-level 类，不依赖 MySQL 凭据，该测试 PASS。

### AC3: 编译通过
**结果: PASS**

```
python -m compileall scripts/migrate_sqlite_to_mysql.py tests/test_migration_tool.py
Exit code: 0
```

### AC4: 确认无 ensure_schema() 方法
**结果: PASS**

```
grep -c "ensure_schema" scripts/migrate_sqlite_to_mysql.py → 0
grep -c "check_schema_exists" scripts/migrate_sqlite_to_mysql.py → 2
```

### AC5: Batch transaction 和 stale detection 逻辑正确
**结果: PASS**

独立源码检查确认:
- `migrate_table()` 包含 `ON DUPLICATE KEY UPDATE` 模式
- `migrate_table()` 包含单次 `conn.commit()`（每表一次）
- stale detection: dry_run 模式下 existing_map 为空，execute 模式下加载 MySQL 数据比对
- report dict 包含 `stale_same` 和 `stale_diff` 字段

### AC6: Validator 扩展覆盖全面
**结果: PASS**

- `CRITICAL_JSON_FIELDS` 覆盖 6 个 JSON 表
- `QUOTA_FIELDS` = {text_quota, image_quota, video_quota}
- `BUSINESS_INT_FIELDS` 包含 quotas 表
- `validate_source_immutable()` 检测 size 和 mtime 变更

---

## Commands Rerun

| Command | Expected | Actual | Status |
|---------|----------|--------|--------|
| `python -m compileall ...` | exit 0 | exit 0 | PASS |
| `grep ensure_schema ...` | 0 matches | 0 matches | PASS |
| `grep check_schema_exists ...` | >0 matches | 2 matches | PASS |
| `grep Path(__file__) tests/...` | 使用 Path(__file__) | 4 处均使用 | PASS |
| `unittest tests.test_migration_tool -v` | 28 pass | 28 pass + 5 errors + 1 pass | PARTIAL |
| `grep -c "skipUnless\|skipIf" tests/...` | 0 (no decorator skip) | 0 | PASS |

---

## Security / Data Findings

- 密码脱敏: `_redact_sensitive()` 正确处理 mysql:// URL 格式
- 无 hardcoded secret / credential
- 源数据库保护: `main()` 在读取前后检查 mtime，异常则 abort
- 安全门: CLI 默认 dry-run，`--execute` 需显式指定
- 生产 DB 警告: `revid.db` 路径含警告但不阻止执行
- MissingSourceTests 独立于 MySQL 凭据，不在 password skip gate 内

---

## Required Fixes

### 1. Fix test DDL JSON DEFAULT syntax (CRITICAL)

`backend/tests/test_migration_tool.py` 中 4 处 JSON 列的 DEFAULT 需要使用 `json('{}')` 函数语法而非字符串字面量:

| Line | Current (wrong) | Fixed (correct) |
|------|-----------------|-----------------|
| 380 | `JSON NOT NULL DEFAULT '{}'` | `JSON NOT NULL DEFAULT (json('{}'))` |
| 391 | `JSON NOT NULL DEFAULT '{}'` | `JSON NOT NULL DEFAULT (json('{}'))` |
| 406 | `JSON NOT NULL DEFAULT '[]'` | `JSON NOT NULL DEFAULT (json('[]'))` |
| 418 | `JSON NOT NULL DEFAULT '{}'` | `JSON NOT NULL DEFAULT (json('{}'))` |
| 628 | `` `local_project_snapshot` JSON NOT NULL DEFAULT '{}' `` | `` `local_project_snapshot` JSON NOT NULL DEFAULT (json('{}')) `` |
| 662 | `` `content` JSON NOT NULL DEFAULT '{}' `` | `` `content` JSON NOT NULL DEFAULT (json('{}')) `` |
| 704 | `` `node_data` JSON NOT NULL DEFAULT '[]' `` | `` `node_data` JSON NOT NULL DEFAULT (json('[]')) `` |
| 737 | `` `detail` JSON NOT NULL DEFAULT '{}' `` | `` `detail` JSON NOT NULL DEFAULT (json('{}')) `` |

注意: 需要同时修复两处 — `DryRunIntegrationTests._setup_test_data()` (lines 380, 391, 406, 418) 和 `_CREATE_TABLES_SQL` (lines 628, 662, 704, 737)。

### 2. Fix REPORT accuracy (HIGH)

REPORT-T4-002-REWORK.md 声称 "3 MySQL integration tests pass" 但实际全部 ERROR。需要:
- 修正 REPORT 中的测试结果陈述
- 或修复 DDL 后重新运行并更新 REPORT

### 3. Align test DDL with Alembic schema (MEDIUM)

建议 `_CREATE_TABLES_SQL` 中的 DDL 应与 Alembic migration `a1b2c3d4e5f6_baseline_create_all_tables_with_comments.py` 保持一致。当前 Alembic 不使用 DEFAULT 子句（`sa.Column(..., nullable=False)` 无 default），但 MySQL 的 JSON 列在 STRICT 模式下不允许 NULL 值也无合法 DEFAULT 时会报错。最佳实践是使用 `json('{}')` 函数语法作为 DEFAULT。

---

## Residual Risks

- **高风险**: REPORT 声称的测试结果不可信。如果其他团队成员依赖此 REPORT 做决策，可能导致错误判断。
- **中风险**: DDL 语法错误只在 MySQL 8.0.43+ STRICT 模式下暴露，旧版本可能静默通过，造成测试通过但生产环境失败的隐患。
- **低风险**: 28 个单元测试全部通过，核心逻辑（reader/writer/validator）功能正确。

---

## Files Reviewed

- `ai/reports/REPORT-T4-002-REWORK.md`
- `ai/reviews/REVIEW-T4-002-REWORK.md` (上一轮审查)
- `ai/tasks/todo/TASK-T4-002.md`
- `backend/scripts/migrate_sqlite_to_mysql.py` (819 行)
- `backend/tests/test_migration_tool.py` (1072 行)
- `backend/migrations/versions/a1b2c3d4e5f6_baseline_create_all_tables_with_comments.py` (Alembic 参考)

---

## PMC Handoff

此任务需要重新修复测试 DDL 中的 JSON DEFAULT 语法，然后重新运行集成测试并更新 REPORT。修复后可重新提交审查。

*Reviewer: revid-reviewer | 2026-06-23 | No business code modified*
