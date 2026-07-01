# TASK-T4-002-UNIT-C3-REV30-PLAN

## Revision
`phase4-wave2-unit-c3-ac4-failure-cleanup-2026-07-01-30`

## Objective
Bind AC4 real-MySQL failure-safe cleanup and the non-MySQL regression to a single extraction: a minimal `_cleanup_orphan_and_restore_fk` helper that deletes `q-orphan`, verifies deletion, and restores `FOREIGN_KEY_CHECKS=1`. Both the real AC4 test and the regression must call this helper.

## Design

### 1. Extract cleanup helper function

Add a module-level private function in `backend/tests/test_migration_tool.py`:

```python
def _cleanup_orphan_and_restore_fk(engine, orphan_id="q-orphan", table="quotas"):
    """Delete FK orphan, verify deletion, restore FK checks.

    Always runs: SET FK=0 → DELETE → SET FK=1 → COMMIT.
    Verifies deletion count == 0.
    Raises on verification failure.
    Returns nothing on success.
    """
```

This function takes a SQLAlchemy engine (already connected), the orphan ID, and the table name. It:
- Sets `FOREIGN_KEY_CHECKS=0`
- Deletes the orphan row
- Sets `FOREIGN_KEY_CHECKS=1`
- Commits
- Verifies the row is gone

### 2. Refactor AC4 to use the helper

In `test_ac4_fk_orphan_detected`:
- Move the Phase 1 orphan insert as-is.
- After the assertion (Phase 4), extract the deletion/verification/FK-restoration block (Phase 5) into a call to `_cleanup_orphan_and_restore_fk(engine)`.
- Wrap the entire test body in try/except/finally where `finally` calls the cleanup helper, ensuring deletion runs even if assertion fails.

Key structure:
```python
def test_ac4_fk_orphan_detected(self):
    engine = create_engine(...)
    reader = writer = val_writer = None
    try:
        # Phase 1: disable FK, insert orphan
        # Phase 2: migrate
        # Phase 3: validate
        # Phase 4: assert FK orphan detected
    except Exception:
        # re-raise after cleanup
        raise
    finally:
        # Close resources
        # THEN call _cleanup_orphan_and_restore_fk(engine)
```

Wait — the constraint says cleanup must run BEFORE resource close or at least be failure-safe. Let me re-read:

Constraint 2: "cleanup 必须删除 q-orphan、验证该 row 不存在，并在退出前恢复 FOREIGN_KEY_CHECKS=1；不得把删除留在 normal-path 主 try body。"

So the orphan deletion must NOT be in the normal-path `try` body — it must be in `finally`. And FK restoration must happen before exiting.

New structure:
```python
def test_ac4_fk_orphan_detected(self):
    engine = create_engine(...)
    reader = writer = val_writer = None
    try:
        # Phase 1: disable FK, insert orphan
        # Phase 2: migrate  
        # Phase 3: validate
        # Phase 4: assert FK orphan detected
    except Exception as exc:
        # Store exception for re-raising after cleanup
        stored_exc = exc
    else:
        stored_exc = None
    finally:
        # Resource close
        if val_writer: val_writer.close()
        if writer: writer.close()
        if reader: reader.close()
        engine.dispose()
        # Cleanup: delete orphan, verify, restore FK
        _cleanup_orphan_and_restore_fk(engine, "q-orphan", "quotas")
    
    if stored_exc:
        raise stored_exc
```

Actually, simpler: use try/except/finally where finally does both resource close AND cleanup:

```python
try:
    # phases 1-4
    ...
finally:
    # resource close
    ...
    # cleanup: delete orphan, verify, restore FK
    _cleanup_orphan_and_restore_fk(engine)
```

But the constraint says "resource close、orphan deletion或 FK restoration 的失败不得静默吞掉". So if cleanup fails, it must be visible.

Better approach with exception chaining:
```python
try:
    # phases 1-4
    ...
except Exception as body_exc:
    stored_body_exc = body_exc
else:
    stored_body_exc = None
finally:
    # resource close
    ...
    # cleanup
    try:
        _cleanup_orphan_and_restore_fk(engine)
    except Exception as cleanup_exc:
        if stored_body_exc:
            # Chain: body failed AND cleanup failed
            cleanup_exc.__cause__ = stored_body_exc
        raise cleanup_exc

if stored_body_exc:
    raise stored_body_exc
```

Hmm, this is getting complex. Let me simplify — the task says "通过明确的 chaining/grouping 保留并暴露 cleanup failure". Python's `raise ... from ...` handles this well.

### 3. Refactor regression test to call the same helper

The current regression (`test_ac4_cleanup_runs_when_body_fails`) mocks `close()` and tracks invocations. It does NOT test orphan deletion or FK restoration.

New regression design:
- Create a temporary SQLite engine (no MySQL needed).
- Insert a fake "orphan" row into a mock table.
- Inject a validator failure (mock `MigrationValidator.validate` to raise).
- In the `finally` block, call the SAME `_cleanup_orphan_and_restore_fk` helper (using the SQLite engine with equivalent FK operations).
- Verify the orphan row was deleted and FK was restored.

Wait — SQLite doesn't support `FOREIGN_KEY_CHECKS`. The constraint says "non-MySQL regression 不得访问 MySQL". But it needs to demonstrate deletion-equivalent and FK-restoration-equivalent state.

Alternative: use a mock engine that tracks FK check state and deletion operations. This way we prove the cleanup helper is called and its effects are observable.

Actually, re-reading constraint 4: "必须执行 injected-failure path 并观察 deletion-equivalent 与 FK-restoration-equivalent state." This means the regression must actually execute the failure path and observe the states. Since we can't use MySQL, we need a mechanism that simulates the FK state and deletion.

Best approach: 
1. Create a lightweight wrapper/context manager that tracks `FOREIGN_KEY_CHECKS` state.
2. Mock the engine's `connect()` to return a connection that records FK state changes and deletion queries.
3. Call `_cleanup_orphan_and_restore_fk` and verify it performs: FK=0 → DELETE → FK=1 → verify count=0.

Or even simpler: make `_cleanup_orphan_and_restore_fk` accept a `db_url` or engine, and for the regression, use an in-memory SQLite that supports the same SQL pattern (without actual FK enforcement, but the DELETE and verification still work).

Actually, the simplest bound approach: the regression creates a real in-memory SQLite DB, inserts a row, then calls `_cleanup_orphan_and_restore_fk` with that SQLite engine. The function's SQL (SET FOREIGN_KEY_CHECKS, DELETE, VERIFY) will work on SQLite too — `SET FOREIGN_KEY_CHECKS` is a no-op in SQLite, but DELETE and COUNT(*) work correctly. This proves the helper executes and deletes the row.

### 4. Exception visibility in cleanup

Per constraint 5: if both body failure and cleanup failure occur, the cleanup failure must be visible. Use `raise cleanup_exc from body_exc` pattern.

### 5. Shared helper signature

```python
def _cleanup_orphan_and_restore_fk(engine, orphan_id="q-orphan", table="quotas"):
    """Delete FK orphan, verify, restore FK. Works with both MySQL and SQLite."""
    with engine.connect() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS=0"))
        conn.execute(text(f"DELETE FROM {table} WHERE id=:oid"), {"oid": orphan_id})
        conn.execute(text("SET FOREIGN_KEY_CHECKS=1"))
        conn.commit()
        cnt = conn.execute(
            text(f"SELECT COUNT(*) FROM {table} WHERE id=:oid"), {"oid": orphan_id}
        ).scalar()
        if cnt != 0:
            raise RuntimeError(f"Orphan {orphan_id} still exists after cleanup (count={cnt})")
```

### File changes summary

Only `backend/tests/test_migration_tool.py` is modified.

Changes:
1. Add `_cleanup_orphan_and_restore_fk()` helper function (module-level).
2. Refactor `test_ac4_fk_orphan_detected` to call the helper in `finally`.
3. Refactor `TestUnitC3CleanupRegression.test_ac4_cleanup_runs_when_body_fails` to inject validator failure, call the same helper, and verify deletion-equivalent + FK-restoration-equivalent state.

### Verification commands

```bash
python -m py_compile backend/tests/test_migration_tool.py
python -m pytest backend/tests/test_migration_tool.py::TestUnitC3CleanupRegression::test_ac4_cleanup_runs_when_body_fails -q -p no:cacheprovider
python -m pytest backend/tests/test_migration_tool.py::TestMigrationTool::test_ac4_fk_orphan_detected backend/tests/test_migration_tool.py::TestMigrationTool::test_ac6_consistency_report backend/tests/test_migration_tool.py::TestMigrationTool::test_ac10_conflict_nonzero_exit backend/tests/test_migration_tool.py::TestMigrationTool::test_ac11_partial_rollback backend/tests/test_migration_tool.py::TestMigrationTool::test_ac12_cleanup_failure_visible -q -p no:cacheprovider
git diff --check -- backend/tests/test_migration_tool.py
```
