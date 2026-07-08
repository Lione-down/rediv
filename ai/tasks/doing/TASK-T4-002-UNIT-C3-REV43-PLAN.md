# PLAN — T4-002 Unit C3 Revision 43: Shared Cleanup Lifecycle Correction

## Revision

`phase4-wave2-unit-c3-shared-cleanup-lifecycle-correction-2026-07-07-43`

## Task

T4-002 — Executor - Unit C3 revision 43 shared cleanup lifecycle correction

## Objective

Fix rev42 PMC-identified gaps:
1. `_run_cleanup_lifecycle()` ExceptionGroup receives tuples, not exception instances.
2. FK disable failure recorded under wrong variable (`restore_failed`).
3. Delete-failure regression manually copies lifecycle instead of calling shared helper.
4. Multi-failure regression manually constructs ExceptionGroup instead of exercising actual orchestration.
5. Real AC4 does not assert ordered cleanup events.
6. Resource close failures silently swallowed by `except Exception: pass`.

## Plan

### Change 1: Fix `_run_cleanup_lifecycle()` (lines ~393-489)
- Rename `restore_failed` to `fk_disable_failed` and `fk_restore_failed`
- Replace tuple-based failure collection with labelled `RuntimeError` wrapping
- Each failure gets its own `RuntimeError("Cleanup {label} failed")` instance
- `ExceptionGroup` receives the instance list directly (not tuples)
- Single failure path: raise the wrapped RuntimeError directly

### Change 2: Rewrite `test_cleanup_lifecycle_restores_fk_when_delete_fails`
- Replace manual lifecycle copy with a call to `_run_cleanup_lifecycle()`
- Use `FailingDeleteConnection` proxy + `umock.patch.object(fake_engine, 'connect', ...)` to inject DELETE failure
- Assert `RuntimeError("Cleanup delete failed")` is raised
- Assert recorder shows ordered events

### Change 3: Rewrite `test_cleanup_lifecycle_preserves_primary_close_and_restore_failures`
- Keep the Task-required test name so the exact selector remains executable
- Replace manual ExceptionGroup construction with actual `_run_cleanup_lifecycle()` plus one combined failure wrapper
- Use `RestoreFailConnection` proxy: FK disable is no-op, DELETE/verify execute, FK restore raises
- Assert `ExceptionGroup` with body, close, and cleanup lifecycle failures, and assert cleanup cause includes `Cleanup fk_restore failed`

### Change 4: Update real AC4 `test_ac4_fk_orphan_detected`
- Add `close_failures = []` list to collect resource close exceptions
- Replace `except Exception: pass` with `except Exception as exc: close_failures.append(...)`
- Attach close failures to cleanup_exc.__cause__ for traceability
- Add post-success assertion: `ac4_recorder == ["fk_disable", "delete", "verify", "fk_restore"]`

## Allowed Files
- Only `backend/tests/test_migration_tool.py`

## Verification Commands
1. `python -m py_compile backend/tests/test_migration_tool.py`
2. Non-MySQL regressions (3 tests)
3. Real-MySQL selectors (5 tests)
4. `git diff --check`

## Progress Update

2026-07-07 direct fast-path owner intervention:

- `_run_cleanup_lifecycle()` now wraps labelled exception instances and preserves original causes.
- Added `_raise_combined_cleanup_failures()` as the single wrapper for primary body, resource close, and cleanup lifecycle failures.
- `test_cleanup_lifecycle_restores_fk_when_delete_fails` now calls `_run_cleanup_lifecycle()` and proves `fk_restore` is attempted after injected DELETE failure.
- `test_cleanup_lifecycle_preserves_primary_close_and_restore_failures` now uses actual cleanup lifecycle execution with injected FK restore failure and verifies body/close/cleanup failures in one valid `ExceptionGroup`.
- Real AC4 close failures are no longer silently swallowed; they are surfaced after cleanup.
- `py_compile` passed.
- Three non-MySQL Unit C3 regressions passed.
- Five real-MySQL selectors were attempted and hard-blocked because `REVID_TEST_MYSQL_ADMIN_URL` is not set in the current process. No `.env` or secret fallback was read.
