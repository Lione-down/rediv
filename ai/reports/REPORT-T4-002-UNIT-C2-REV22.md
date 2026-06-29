# REPORT — T4-002 Unit C2 Revision 22

## Task
T4-002 / UNIT-C2 — Migration Core Child-Contract Correction

## Revision
`phase4-wave2-unit-c2-child-contract-corrected-2026-06-29-22`

## Attempt
1

## Objective
在 disposable MySQL database `revid_test_t4_002` 中真实执行 migration core 四项验证：
1. `test_ac1_dry_run_no_changes` — dry-run 前后 users row count 不变
2. `test_ac2_full_migration_succeeds` — full migration 后 12 张表 row counts 与 fixture 对应
3. `test_ac3_idempotency` — second run 后 12 张表 row counts 不变
4. `test_ac5_source_immutable` — SQLite fixture 文件 size 不变

## Acceptance Criteria 对照

| AC | Selector | Result | Notes |
|----|----------|--------|-------|
| AC1 | `test_ac1_dry_run_no_changes` | **PASSED** | Dry-run did not change MySQL data. Before/after row count identical. |
| AC2 | `test_ac2_full_migration_succeeds` | **PASSED** | Full migration succeeded. All 12 tables populated with correct row counts matching fixture. |
| AC3 | `test_ac3_idempotency` | **FAILED** | See defect below. |
| AC5 | `test_ac5_source_immutable` | **PASSED** | Fixture file size unchanged before/after reader.open(). |

## AC3 Defect Detail

**Error**: `sqlalchemy.exc.IntegrityError: (pymysql.err.IntegrityError) (1062, "Duplicate entry 'q-001' for key 'quotas.PRIMARY'")`

**Root cause**: `migrate_sqlite_to_mysql.py:migrate_table()` at line 445 builds a bulk INSERT SQL that includes ALL source rows, including rows whose PK already exists in MySQL with identical values (stale_same). The stale_same counter is incremented (line 414) but these rows are never filtered out of the INSERT batch.

**Expected behavior**: stale_same rows should be excluded from the INSERT batch — they are already present and identical, so no write is needed.

**Actual behavior**: stale_same rows are included in the INSERT, causing a duplicate PK error on the second migration run.

**Location**: `backend/scripts/migrate_sqlite_to_mysql.py:445` — `sql = f"INSERT INTO \`{table_name}\` ..."` uses `rows` (all source rows) instead of filtering to only new-PK rows.

## 实际修改文件

无业务文件修改（任务要求只读）。

创建的文件：
- `ai/tasks/doing/TASK-T4-002-UNIT-C2-REV22-PLAN.md`
- `ai/tasks/doing/TASK-T4-002-UNIT-C2-REV22-PROGRESS.md`
- `ai/reports/REPORT-T4-002-UNIT-C2-REV22.md`

## 实际命令和退出码

```
$ python -m py_compile backend/scripts/migrate_sqlite_to_mysql.py   → exit 0 (OK)
$ python -m py_compile backend/tests/test_migration_tool.py         → exit 0 (OK)
$ python -m pytest ...::test_ac1_dry_run_no_changes -v              → exit 0 (PASSED)
$ python -m pytest ...::test_ac2_full_migration_succeeds -v         → exit 0 (PASSED)
$ python -m pytest ...::test_ac3_idempotency -v                     → exit 1 (FAILED)
$ python -m pytest ...::test_ac5_source_immutable -v                → exit 0 (PASSED)
$ python -m pytest [all 4 selectors] -v                             → exit 1 (3 passed, 1 failed, 1 error)
```

## 测试分类

| Category | Count | Details |
|----------|-------|---------|
| Passed | 3 | AC1, AC2, AC5 |
| Failed | 1 | AC3 (defect in migrate_table stale_same handling) |
| Skipped | 0 | — |
| Not executed | 0 | All four selectors executed |

## Hard Gate Provenance

- `REVID_TEST_MYSQL_ADMIN_URL`: Present and set (verified)
- Business files read-only: Confirmed — no modifications made
- No secret/token exposure in output

## 未验证项

- AC3 失败是由于业务代码缺陷，不是测试本身的问题。修复需要在 `migrate_table` 中过滤 stale_same 行后再构建 INSERT SQL。

## 数据库/API/安全/兼容性风险

- **兼容性**: AC3 失败影响幂等性保证。在生产环境中，如果迁移脚本被意外重复执行（如 cron 重试），可能导致数据写入失败。
- **安全**: 无安全风险。
- **数据迁移**: AC1、AC2、AC5 均通过，证明基本迁移流程正常。

## Rollback 与 Cleanup 结果

- `tearDownClass` 成功 drop 了 `revid_test_t4_002` 数据库。
- `fixture.db` 清理因 Windows 文件锁定报错（PermissionError），但不影响测试结果。这是 Python 在 Windows 上的已知行为（文件句柄未及时释放）。

## 结论

3/4 selectors passed. AC3 失败暴露 `migrate_sqlite_to_mysql.py` 中 `migrate_table()` 的 stale_same 行过滤缺陷。由于任务要求业务文件只读，本次 revision 无法修复。建议创建子任务修复 `migrate_table` 的 INSERT 过滤逻辑。
