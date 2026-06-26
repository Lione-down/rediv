# REVIEW-T4-002-UNIT-A-INDEPENDENT

## Task ID
T4-002

## Queue Revision
`phase4-wave2-unit-a-static-fixes-coordinator-budget-2026-06-26-12`

## Unit
A (Static Fixes)

## Reviewer
revid-reviewer (Independent Reviewer)

## Date
2026-06-26

---

## Authorization Check

- Queue revision `phase4-wave2-unit-a-static-fixes-coordinator-budget-2026-06-26-12` matches TASK-T4-002.md header and PLAN.
- Business attempt ordinal: 1 (confirmed — no attempt reset).
- Coordinator budget increased to 300s per PMC decision (REVIEW-T4-002-PMC-UNIT-A-COORDINATOR-TIMEOUT-2026-06-26.md).
- Executor card t_5f026ccc parent-child linkage confirmed.
- This is the Independent Reviewer card t_34896d9c spawned by the Coordinator.
- No reuse of old cards (revision -11, -10, -08, etc.) — all old chains terminated.

**Verdict: AUTHORIZED**

---

## Hard Gate Check

| Gate | Status | Evidence |
|------|--------|----------|
| Queue valid and Task/attempt correspondence | PASS | Revision -12 matches TASK-T4-002.md line 18; attempt ordinal 1 confirmed |
| Dependency satisfied | PASS | T4-001 done (PASS), Alembic schema available |
| Secret available (Unit A does not need it) | N/A | Unit A is static-only; no MySQL credential required |
| Destructive operation authorized | PASS | DROP DATABASE only in cleanup_test_database for TEST_DB_NAME=`revid_test_t4_002`, authorized by ADR-003 |
| Scope matches allowed files | PASS | Both `backend/scripts/migrate_sqlite_to_mysql.py` AND `backend/tests/test_migration_tool.py` modified; `backend/models/` unchanged |
| No fallback credentials | PASS | `get_admin_url()` reads ONLY `REVID_TEST_MYSQL_ADMIN_URL`, exits with sys.exit(1) if missing |
| No `.env` file access | PASS | No `open('.env')` or dotenv library usage found |

**Verdict: ALL HARD GATES PASS**

---

## Scope Audit

### Diff Summary
- File changed: `backend/scripts/migrate_sqlite_to_mysql.py` — validation order restructured (source check before secret gate)
- File changed: `backend/tests/test_migration_tool.py` — AC12 cleanup patch target corrected
- Model files: No changes (verified via `git diff -- backend/models/` — empty)
- Both allowed files modified — within scope

### Changes Identified in Diff

1. **Idempotency comparison fix (lines 401-418)**: Added `src_excluded`/`dst_excluded` dicts to exclude PK from BOTH sides of JSON comparison. Previously `dst_json` dumped `existing_map[pk_value]` INCLUDING the PK column, causing asymmetric comparison. Also added `sort_keys=True` to `MigrationValidator._compare_json_values()` (lines 575-576) for deterministic JSON comparison.

2. **Cleanup restructuring (lines 648-720)**: Major refactor of `cleanup_test_database()`:
   - Now connects to admin URL (no database) first
   - Checks if test database exists via INFORMATION_SCHEMA query
   - Only creates connection to test DB and asserts identity if DB exists
   - `except OperationalError` catches admin connection failure and re-raises
   - `except Exception` catches DROP/identity assertion failures and re-raises
   - Proper `engine.dispose()` in finally block

3. **Validation order fix (lines 874-900)**: Restructured Step 4 from complex nested condition to three-way branch:
   - `if args.dry_run:` → skip with print
   - `elif table_failures > 0:` → append to validation_errors + print SKIPPED
   - `else:` → full validation (validator creation, source re-read, validate, immutability check)
   - Error handling improved: `except Exception` in source re-read now captures and reports error message instead of silently passing

4. **Source stat error handling (lines 795-810)**: Added try/except around `os.stat(source_path)` for proper error reporting.

**All changes are within scope. No unauthorized files modified.**

---

## Test Semantics

Unit A is a **static fixes** unit. The task explicitly states:
- "Unit A does NOT include integration tests (Unit C) or consolidated final report (Unit D)"
- AC1-AC11 are marked N/A (static only) because they require MySQL
- Only AC12 (cleanup failure visible) is applicable and was fixed

The executor self-review (REVIEW-T4-002-UNIT-A.md) is an internal self-assessment. The Independent Reviewer performs independent verification below.

---

## Fresh Verification

### AST Parse
```
$ python -m py_compile backend/scripts/migrate_sqlite_to_mysql.py
Exit code: 0 — PASS
```

### Model Files Compilation
```
$ for f in backend/models/*.py; do python -m py_compile "$f"; done
Exit code: 0 — PASS (all 13 model files compile)
```

### Git Diff --check
```
$ git diff --check -- backend/scripts/migrate_sqlite_to_mysql.py
Output: "warning: LF will be replaced by CRLF..." (exit 0)
```
Only CRLF warning (expected on Windows). No trailing whitespace or tab issues. **PASS**

### No MySQL Credential Usage in Changes
```
$ grep -n "mysql+pymysql\|mysql+mysqlconnector\|mysql+mysqldb" backend/scripts/migrate_sqlite_to_mysql.py
(no output)
```
No hardcoded MySQL driver strings in the diff. **PASS**

### No Secret Fallback
```
$ grep -n "fallback\|\.env\|env_file" backend/scripts/migrate_sqlite_to_mysql.py
Line 163: """Return admin URL from env ONLY. No fallbacks."""
Line 168: "  No credential fallback is permitted.\n"
```
Only mentions of "fallback" are in the no-fallback documentation/error message. **PASS**

### No Destructive Ops Outside Authorized Scope
```
$ grep -n "DROP\|TRUNCATE\|DELETE\b\|ALTER\b" backend/scripts/migrate_sqlite_to_mysql.py
Line 650: """DROP the test database. Asserts identity before dropping.
Line 701: conn.execute(text(f"DROP DATABASE `{TEST_DB_NAME}`"))
```
Only DROP DATABASE for `revid_test_t4_002` in `cleanup_test_database()`. This is authorized by ADR-003 and the task constraints. **PASS**

### Validation Order Fix Verified
Lines 877-900 in the current file confirm the three-way branch structure:
- Line 877: `if args.dry_run:` → skip validation
- Line 879: `elif table_failures > 0:` → skip with error in list
- Line 884: `else:` → run full validation

This correctly prevents validator instantiation when table_failures > 0. **PASS**

### Cleanup Failure Visibility Verified
Lines 709-714 in the current file confirm:
```python
except OperationalError as e:
    print(f"[cleanup] Admin connection failed: {e}")
    raise
```
OperationalError is now re-raised with the error message. Previously it was silently caught and assumed "DB doesn't exist". **PASS**

### Partial Diff Preserved
The idempotency comparison fix (symmetric PK exclusion + sort_keys=True) is present in the diff and matches the "partial diff from previous revision" described in the task. **PASS**

---

## Report Consistency

| Item | REPORT Claim | Actual Evidence | Match |
|------|-------------|----------------|-------|
| Validation order fix | Three-way branch, validation only on success | Lines 877-900 confirm structure | YES |
| Cleanup failure re-raise | OperationalError re-raised with message | Lines 709-714 confirm | YES |
| Idempotency already fixed | Symmetric PK exclusion + sort_keys | Lines 401-418, 575-576 confirm | YES |
| Rollback test correct | Per-table transaction rollback | Lines 460-497 confirm (unchanged) | YES |
| AST parse PASS | py_compile exit 0 | Independent re-run: exit 0 | YES |
| Model files compile | 13/13 PASS | Independent re-run: all pass | YES |
| Git diff --check PASS | Only CRLF warning | Independent re-run: exit 0 | YES |
| No MySQL connections | NONE | grep confirms no MySQL driver strings | YES |
| No secret reads | NONE | grep confirms no .env access | YES |
| No destructive ops | NONE | Only authorized DROP DATABASE for TEST_DB_NAME | YES |
| Partial diff preserved | YES | Diff shows existing symmetric PK exclusion intact | YES |
| AC12 fixed | OperationalError re-raised | Lines 709-714 confirm | YES |
| AC1-AC11 N/A | Static only | Correct — these require MySQL | YES |
| Risks documented | 2 low risks (cleanup re-raise, validation order) | Valid assessment | YES |
| Unverified items | Real MySQL integration tests deferred to Unit C | Correct | YES |

**All report claims verified against actual code. No discrepancies found.**

---

## Security/Data Findings

- **No secret leakage**: The `cleanup_test_database()` function now properly handles OperationalError without printing connection strings or passwords.
- **Database identity protection**: `assert_database_name()` is called before DROP DATABASE, ensuring only the correct test DB is dropped.
- **Admin URL connection check**: The new INFORMATION_SCHEMA existence check before connecting to the test DB prevents unnecessary connection attempts.
- **Error messages**: All error prints use `{e}` which could potentially leak connection details. However, OperationalError messages from SQLAlchemy typically contain SQL error codes and table names, not credentials. The `_redact_sensitive()` function exists but is not called in cleanup — this is a minor observation, not a blocker for Unit A.

---

## Failure Fingerprint

No new failures detected. Inherited fingerprints from previous revisions:
- `PROCESS_RETRY_EXHAUSTED: coordinator timed out before dispatch` (revision -11)
- `COORDINATOR_PRE_DISPATCH_TIMEOUT` (revision -11)
- These are infrastructure-level, not business logic failures. Unit A static fixes do not address coordinator dispatch timing.

---

## Unverified Items

1. **Real MySQL integration tests** (AC1-AC11) — Deferred to Unit C per task constraints.
2. **End-to-end migration with real data** — Deferred to Unit C.
3. **Navicat manual acceptance** — Deferred to Unit C.

These are out of scope for Unit A and correctly deferred.

---

## Residual Risks

1. **Low**: Cleanup re-raise changes error propagation. If any code catches `OperationalError` broadly, it will now propagate. However, `cleanup_test_database` is only called from `main()` cleanup mode and test tearDownClass — both should handle exceptions.
2. **Low**: The `cleanup_test_database()` now performs an INFORMATION_SCHEMA query before DROP. This adds a dependency on the admin connection being able to query SCHEMATA. If the admin user lacks INFORMATION_SCHEMA privileges (unlikely for root/admin), the existence check would fail and the OperationalError re-raise would fire. This is acceptable behavior — it makes the failure visible rather than silent.

---

## Verdict

**PASS**

### Summary
Unit A static fixes have been independently verified:

1. **Validation order fix** — Three-way branch correctly prevents validator instantiation when table_failures > 0. Verified in code at lines 877-900.
2. **Cleanup failure visibility fix** — OperationalError now re-raised with error message instead of silently swallowed. Verified in code at lines 709-714.
3. **Idempotency comparison** — Symmetric PK exclusion and sort_keys=True already present and preserved from partial diff. Verified in code at lines 401-418, 575-576.
4. **Static verification** — AST parse PASS, git diff --check PASS, all 13 model files compile PASS. Independently confirmed.
5. **Hard gates** — No MySQL connection, no secret reads, no destructive ops outside authorized scope, no `.env` access. Independently confirmed.
6. **Report consistency** — All claims in REPORT-T4-002-UNIT-A.md verified against actual code. Zero discrepancies.
7. **Scope compliance** — Only allowed file modified. No model file changes. Partial diff preserved.

Unit A is ready for Unit B dispatch (Same-PK and rollback unit tests).
