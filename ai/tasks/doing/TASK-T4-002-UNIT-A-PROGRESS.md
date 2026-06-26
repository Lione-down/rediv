# TASK-T4-002 Unit A Progress

## Queue Revision
`phase4-wave2-unit-a-static-fixes-pmc-rework-2026-06-26-13`

## Task ID
T4-002

## Unit
A (Static Fixes Correction)

## Business Attempt Ordinal
1

## Timeline

### 2026-06-26 — Unit A PMC Rework Correction

1. **Orient** (0 min)
   - Read full TASK-T4-002.md specification
   - Read PMC Unit A Rework review (REVIEW-T4-002-PMC-UNIT-A-REWORK-2026-06-26.md)
   - Read both allowed files in full
   - Read existing REPORT, Independent REVIEW, and HANDOFF artifacts
   - Check git diff status: both `backend/scripts/migrate_sqlite_to_mysql.py` and `backend/tests/test_migration_tool.py` modified

2. **Applied Defect 1 Fix: Source validation before secret gate**
   - Moved source file existence/stat validation (was lines ~796-808) to BEFORE `get_admin_url()` call (was lines ~776-778)
   - Validation order now: source check → secret gate → rest of main()
   - Cleanup mode (`--cleanup`) unchanged: still requires admin URL (correct, no source needed)
   - When source is missing, error is now "Source SQLite database not found" instead of "REVID_TEST_MYSQL_ADMIN_URL is not set"

3. **Applied Defect 2 Fix: AC12 cleanup patch target**
   - Changed `patch("scripts.migrate_sqlite_to_mysql.cleanup_test_database", ...)` to `patch("test_migration_tool.cleanup_test_database", ...)`
   - Matches the direct import binding `from scripts.migrate_sqlite_to_mysql import cleanup_test_database`
   - The injected fake callable now exercises the actual callable used by the test assertion

4. **Applied Defect 3 Fix: Evidence accuracy**
   - Updated REPORT: "Actual Modified Files" now lists both allowed files
   - Updated Independent REVIEW: Scope Audit diff summary covers both files
   - Updated HANDOFF: Unit A Summary and Modified Files cover both files

5. **Verification** (2 min)
   - AST parse (both files): PASSED
   - Git diff --check (both files): PASSED (CRLF warning only)
   - Confirmed source validation line order: source check (line ~777) → secret gate (line ~792)
   - Confirmed cleanup mode unchanged: get_admin_url() first (correct for cleanup-only path)

## Changes Made

### File: `backend/scripts/migrate_sqlite_to_mysql.py`

#### Change: Source validation moved before secret gate (Defect 1)
**Before:** `get_admin_url()` called at line ~777, source check at line ~799
**After:** Source existence/stat validation at line ~777, `get_admin_url()` at line ~792
**Impact:** Missing source now returns "Source SQLite database not found" instead of "REVID_TEST_MYSQL_ADMIN_URL is not set". Cleanup mode (`--cleanup`) unchanged.

### File: `backend/tests/test_migration_tool.py`

#### Change: AC12 cleanup patch target corrected (Defect 2)
**Before:** `patch("scripts.migrate_sqlite_to_mysql.cleanup_test_database", ...)` — patched wrong binding
**After:** `patch("test_migration_tool.cleanup_test_database", ...)` — matches direct import
**Impact:** The injected fake callable now exercises the actual callable used by the test assertion, proving cleanup failure propagation.

## Static Verification Results

| Check | Result |
|-------|--------|
| AST parse (migrate_sqlite_to_mysql.py) | PASS |
| AST parse (test_migration_tool.py) | PASS |
| Git diff --check | PASS (only CRLF warning) |
| MySQL connection | CONFIRMED: NONE |
| Secret reading | CONFIRMED: NONE |
| Destructive operations | CONFIRMED: NONE |
| Partial diff preserved | YES (existing changes intact) |

## Pending Items for Future Units
- Unit B: Same-PK and rollback unit tests (needs MySQL)
- Unit C: Disposable MySQL integration tests (needs MySQL)
- Unit D: Consolidated final REPORT
- Unit E: Independent REVIEW and HANDOFF
