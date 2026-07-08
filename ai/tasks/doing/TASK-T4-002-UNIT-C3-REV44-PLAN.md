# TASK-T4-002-UNIT-C3-REV44-PLAN

## Meta
- **Task:** T4-002
- **Revision:** phase4-wave2-unit-c3-settings-env-acceptance-2026-07-08-44
- **Idempotency Key:** `revid:phase4-wave2-unit-c3-settings-env-acceptance-2026-07-08-44:T4-002:execute:0`
- **Action:** IMPLEMENT_AND_TEST_ONLY
- **Assigned:** revid-backend

## Objective
Fix `backend/settings/config.py` so that pydantic-settings accepts the authorized `REVID_TEST_MYSQL_ADMIN_URL` key from `.env` without raising validation errors, while suppressing credential material in repr output.

## Scope
- **Modify:** `backend/settings/config.py` only — add `test_mysql_admin_url` field in the `# === Admin ===` section
- **Allowed Files:**
  - `backend/settings/config.py` (modify)
  - `ai/tasks/doing/TASK-T4-002-UNIT-C3-REV44-PLAN.md` (create)
  - `ai/tasks/doing/TASK-T4-002-UNIT-C3-REV44-PROGRESS.md` (create)
  - `ai/reports/REPORT-T4-002-UNIT-C3-REV44.md` (create)

## Out of Scope
- No changes to any other source files
- No `extra="ignore"` — field must be explicit
- No credential output or secret exposure
- No database modifications
- No card creation, delegation, or board operations beyond this task

## Implementation Plan
1. Add `test_mysql_admin_url: str | None = Field(default=None, repr=False)` to the `# === Admin ===` section of `Settings` class in `backend/settings/config.py`
2. Write `TASK-T4-002-UNIT-C3-REV44-PLAN.md`
3. Write `TASK-T4-002-UNIT-C3-REV44-PROGRESS.md`
4. Run verification steps (syntax check, env regression, real-MySQL selectors, git diff)
5. Write `REPORT-T4-002-UNIT-C3-REV44.md`
6. Stop at `REPORT_READY` — return to PMC

## Verification Steps
1. `py_compile backend/settings/config.py` — exit 0
2. In-memory test: `Settings()` accepts `REVID_TEST_MYSQL_ADMIN_URL`, repr does not expose credentials
3. Five real-MySQL selectors: `test_ac4_fk_orphan_detected`, `test_ac6_consistency_report`, `test_ac10_conflict_nonzero_exit`, `test_ac11_partial_rollback`, `test_ac12_cleanup_failure_visible` — all pass
4. `git diff --check -- backend/settings/config.py` — no trailing whitespace

## Acceptance Criteria
- `Settings()` no longer fails when `REVID_TEST_MYSQL_ADMIN_URL` is in env
- The setting does not appear in repr with credential material
- Five real-MySQL selectors: `5 passed / 0 failed / 0 skipped / 0 errors`
- Report records only non-secret facts

## Stop Condition
`UNIT_C3_SETTINGS_ENV_ACCEPTANCE_REPORT_READY_REV44`
