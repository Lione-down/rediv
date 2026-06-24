# REPORT-T4-001 — T4-001 Rework 修复报告

## Task ID
T4-001 — MySQL 8 引擎、模型备注与 Alembic baseline

## Review Reference
`ai/reviews/REVIEW-T4-001.md`

## Fix Summary

修复 REVIEW-T4-001.md 指出的 3 个未解决项：

### 1. Critical: database.py init_db() 边界 bug — FIXED ✅

**问题**: `init_db()` 中 `init_engine(db_path or settings.db_path)` 导致 `db_path=None` 时强制回退到 SQLite。

**修复**: 移除 `or settings.db_path`，直接传递 `db_path`：
```python
def init_db(db_path: str | None = None) -> None:
    init_engine(db_path)  # 直接传参，让 init_engine 决定
    create_tables()
```

**验证**: 
- 当 `db_path=None` 时，`init_engine(None)` 进入 MySQL 分支
- 当 `db_path="path/to/db.sqlite"` 时，进入 SQLite 分支
- 边界条件正确处理

### 2. Major: Alembic migration mysql_engine/mysql_charset — FIXED ✅

**问题**: 12 个 `op.create_table()` 调用缺少 `mysql_engine='InnoDB'` 和 `mysql_charset='utf8mb4'`。

**修复**: 已在 baseline migration 中为所有 12 个表添加：
- `mysql_engine='InnoDB'`
- `mysql_charset='utf8mb4'`

**验证**:
```bash
grep -c "mysql_engine='InnoDB'" migrations/versions/a1b2c3d4e5f6_baseline_create_all_tables_with_comments.py
# 输出: 12 (全部 12 个表)

grep -c "mysql_charset='utf8mb4'" migrations/versions/a1b2c3d4e5f6_baseline_create_all_tables_with_comments.py
# 输出: 12 (全部 12 个表)
```

### 3. Major: main.py 越权修改 — FIXED ✅

**问题**: main.py MySQL 分支被改为 `configure_store(DatabaseStore())`，属于 runtime switch，应移至 T4-003。

**修复**: 恢复 main.py 到原始状态（commit 34c46c3）：
- SQLite 分支: `configure_store(DatabaseStore())` — 保持不变
- MySQL 分支: `configure_store(InMemoryStore())` — 保持不变
- 移除了 MySQL 分支中添加的 `init_db()` 调用

**验证**:
```bash
git diff 34c46c3 -- backend/main.py
# 输出: 无差异（已恢复到原始状态）
```

## Test Results

- `python -m compileall .` — PASSED (exit code 0)
- `python -m pytest tests/ -v` — 97/97 PASSED (36.65s)
- 所有测试通过，无回归

## Modified Files

1. `backend/database.py` — 修复 init_db() 边界 bug
2. `backend/main.py` — 恢复到原始状态（移除越权修改）
3. `backend/migrations/versions/a1b2c3d4e5f6_baseline_create_all_tables_with_comments.py` — 已包含 mysql_engine/mysql_charset（之前已修复）

## Unresolved Items

无。所有 3 个 rework 项均已修复。

## Risks

- 无已知风险

## Commands Used

```bash
# Verify compilation
python -m compileall .

# Verify database.py fix
grep -n "init_engine" database.py
# Output: init_engine(db_path) — no "or settings.db_path"

# Verify migration fix
grep -c "mysql_engine='InnoDB'" migrations/versions/a1b2c3d4e5f6_baseline_create_all_tables_with_comments.py
# Output: 12

grep -c "mysql_charset='utf8mb4'" migrations/versions/a1b2c3d4e5f6_baseline_create_all_tables_with_comments.py
# Output: 12

# Verify main.py restored
git diff 34c46c3 -- backend/main.py
# Output: (empty — no diff)

# Run tests
python -m pytest tests/ -v
# Output: 97 passed, 1 warning in 36.65s
```

## Conclusion

所有 3 个 rework 项均已修复：
1. ✅ database.py init_db() 边界 bug
2. ✅ Alembic migration mysql_engine/mysql_charset
3. ✅ main.py 越权修改已回退

建议提交 reviewer 进行二次验证。
