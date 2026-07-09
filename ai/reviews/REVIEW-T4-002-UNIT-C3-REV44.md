# REVIEW-T4-002-UNIT-C3-REV44 — Independent Review

## Meta

- **Task:** T4-002
- **Revision:** phase4-wave2-unit-c3-settings-env-acceptance-2026-07-08-44
- **Reviewer:** revid-reviewer (Agnes-2.0-Flash)
- **Idempotency Key:** `revid:phase4-wave2-unit-c3-rev44-review-dispatch-2026-07-08-44r3:T4-002:review:0`
- **Review Time:** 2026-07-08
- **Verdict:** BLOCKED
- **Fingerprint:** `REV44_REAL_MYSQL_SELECTORS_UNVERIFIED_VENV_PYDANTIC_BROKEN`

## Evidence Collected

### Check 1 — Task/PLAN/PROGRESS/REPORT/Diff/Execution Status: PASSED

- Task `TASK-T4-002-UNIT-C3-REV44.md` exists, scope bounded to `backend/settings/config.py` only.
- PLAN and PROGRESS files not found at expected paths — Task body authorizes creation but executor REPORT claims they were created. This is a documentation gap, not a business defect.
- REPORT `REPORT-T4-002-UNIT-C3-REV44.md` claims: py_compile PASS, non-secret regression PASS, 5 real-MySQL selectors PASS (8.77s), git diff --check PASS.
- Actual `git diff HEAD` confirms `config.py` has exactly 1 line added:
  ```
  +    test_mysql_admin_url: str | None = Field(default=None, repr=False)
  ```
  at line 42 under `# === Admin ===` section. No other files modified. Scope is clean.
- `test_migration_tool.py` diff is large (rev43 cleanup lifecycle additions) but these are already committed to HEAD and not part of rev44's scope. They are inherited from rev43.

### Check 2 — py_compile: PASSED

```
config.py: OK
test_migration_tool.py: OK
```
Exit code 0 for both files.

### Check 3 — Non-secret settings regression: PARTIAL

Attempted to run `Settings()` with `REVID_TEST_MYSQL_ADMIN_URL` set. The backend venv's pydantic import chain resolves to the broken hermes-agent venv pydantic (`ModuleNotFoundError: No module named 'pydantic_core._pydantic_core'`). Cannot execute the settings regression in this environment. The REPORT claims it passed with dummy value — I cannot independently verify this.

### Check 4 — Five real-MySQL selectors: NOT EXECUTED

Cannot execute. Same venv pydantic breakage prevents importing `settings.config` and `test_migration_tool.py`. The REPORT claims `5 passed / 0 failed / 0 skipped / 0 errors` in 8.77s, but I have no independent evidence.

### Check 5 — rev43 cleanup lifecycle regressions: PARTIAL AUDIT

I read the full diff of `test_migration_tool.py` from HEAD~3. The rev43 fixes are present and structurally sound:

- `_run_cleanup_lifecycle()` (lines 393-497): Properly collects failures per-step, wraps each in `RuntimeError` with `__cause__`, uses `ExceptionGroup` correctly when >1 failure, returns ordered event list. Valid.
- `_label_cleanup_failure()` (lines 500-505): Preserves original cause. Valid.
- `_raise_combined_cleanup_failures()` (lines 507-520): Handles body/close/cleanup failures, single vs group path. Valid.
- `_cleanup_orphan_and_restore_fk()` now delegates to `_run_cleanup_lifecycle()` with optional `recorder` param. Valid.
- `test_ac4_fk_orphan_detected`: Uses shared helper with recorder, asserts `ac4_recorder == ["fk_disable", "delete", "verify", "fk_restore"]`. Close failures collected (not silently swallowed). Valid.
- `test_cleanup_lifecycle_restores_fk_when_delete_fails`: Tests delete failure still triggers FK restore via recorder. Valid.
- `test_cleanup_lifecycle_preserves_primary_close_and_restore_failures`: Tests ExceptionGroup with 3 labeled failures (body, close, cleanup) with proper cause chain. Valid.

Structural audit passes — the rev43 regressions (from rev42's `REV42_REGRESSIONS_BYPASS_SHARED_LIFECYCLE_AND_FAILURE_GROUPING_INVALID`) are properly fixed in the committed code.

### Check 6 — git diff --check: PASSED

```
diff --check: OK
```
No trailing whitespace in either file.

## Missing Evidence

| Check | Status | Reason |
|-------|--------|--------|
| Check 3: settings repr regression | NOT VERIFIED | Broken pydantic in venv prevents import |
| Check 4: 5 real-MySQL selectors | NOT VERIFIED | Same venv breakage |
| Check 5: lifecycle regression runtime | STRUCTURAL ONLY | Diff audit passes; runtime execution blocked |

## Verdict

**BLOCKED** — `REV44_REAL_MYSQL_SELECTORS_UNVERIFIED_VENV_PYDANTIC_BROKEN`

The rev44 implementation in `config.py` is correct (single-line addition, scope clean, no trailing whitespace). The rev43 cleanup lifecycle regressions are structurally fixed in `test_migration_tool.py`. However, the two runtime-dependent checks (non-secret settings regression and five real-MySQL selectors) cannot be independently verified because the backend venv's pydantic_core extension module is broken (`ModuleNotFoundError: No module named 'pydantic_core._pydantic_core'`).

**Resolution conditions:**
1. Fix the venv pydantic import (likely a mismatch between pydantic 2.x and pydantic_core binary, or cross-venv PYTHONPATH contamination).
2. Re-run checks 3 and 4 in a clean environment.
3. If both pass, reopen this review for a final PASS verdict.

This BLOCKED is not a business defect — it is a verification infrastructure blocker. The code changes themselves appear correct based on static analysis.
