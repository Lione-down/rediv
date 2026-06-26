# REPORT-T4-002 Unit A Correction — Revision -13

## Queue Revision
`phase4-wave2-unit-a-static-fixes-pmc-rework-2026-06-26-13`

## Task ID
T4-002

## Unit
A (Static Fixes Correction)

## Business Attempt Ordinal
1 (continuation — NOT attempt 2)

## Date
2026-06-26

## Nature of This Report
This is an evidence-only correction for revision `-13`. It does NOT constitute business attempt 2. It does NOT authorize Unit B. It documents the three PMC-identified defects and their fixes.

---

## Acceptance Criteria Results

| # | Acceptance Criterion | Result | Evidence |
|---|---------------------|--------|----------|
| AC1 | Dry-run does not change MySQL data | N/A (static only) | No MySQL connection made |
| AC2 | Full migration succeeds | N/A (static only) | No MySQL connection made |
| AC3 | Idempotency — second run unchanged | N/A (static only) | No MySQL connection made |
| AC4 | FK orphan triggers failure | N/A (static only) | No MySQL connection made |
| AC5 | Source revid.db immutable | N/A (static only) | No MySQL connection made |
| AC6 | 12-table consistency report | N/A (static only) | No MySQL connection made |
| AC7 | Fixture only accepts REVID_TEST_MYSQL_ADMIN_URL | N/A (static only) | No MySQL connection made |
| AC8 | Structured URL API | N/A (static only) | No MySQL connection made |
| AC9 | Alembic creates schema | N/A (static only) | No MySQL connection made |
| AC10 | Same-PK conflict → non-zero exit | N/A (static only) | Static audit confirms symmetric PK exclusion already in partial diff |
| AC11 | Partial rollback | N/A (static only) | Static audit confirms per-table transaction rollback correct |
| AC12 | Cleanup failure visible | FIXED | AC12 cleanup patch target corrected to match import binding |

---

## PMC-Identified Defects and Corrections

### Defect 1: Missing-source still secret-gated — FIXED

**Location:** `backend/scripts/migrate_sqlite_to_mysql.py`, `main()` function

**Issue:** Source file validation occurred AFTER `get_admin_url()` call. When source was missing, error was "REVID_TEST_MYSQL_ADMIN_URL is not set" instead of "Source SQLite database not found".

**Fix:** Moved source existence/stat validation to BEFORE the secret gate. Validation order is now:
1. Source file check (missing, stat error)
2. Secret gate (REVID_TEST_MYSQL_ADMIN_URL)
3. Rest of main()

**Fresh Verification:**
```
python scripts/migrate_sqlite_to_mysql.py --dry-run --source __missing__.db
→ ERROR: Source SQLite database not found: ... (exit 1)
```
Error is "Source SQLite database not found", NOT the secret gate message. **PASS**.

---

### Defect 2: AC12 cleanup patch wrong binding — FIXED

**Location:** `backend/tests/test_migration_tool.py`, `test_ac12_cleanup_failure_visible()`

**Issue:** `patch("scripts.migrate_sqlite_to_mysql.cleanup_test_database", ...)` patched the original module's name, but the test imported `cleanup_test_database` directly, creating a local binding in `test_migration_tool` namespace. Patch target did not match the actual callable used by the test.

**Fix:** Changed patch target to `"test_migration_tool.cleanup_test_database"` to match the direct import binding.

**Verification:** Static audit confirms patch target `"test_migration_tool.cleanup_test_database"` matches the import binding at line 31. The injected fake callable exercises the actual callable used by the test assertion. **PASS**.

---

### Defect 3: Unit A evidence mismatch — FIXED

**Issue:** Previous revision `-12` evidence (REPORT, Independent REVIEW, HANDOFF) only mentioned `backend/scripts/migrate_sqlite_to_mysql.py` as modified. Both allowed files were actually modified.

**Fix:** All three evidence files updated to accurately cover both allowed files:
- `backend/scripts/migrate_sqlite_to_mysql.py` — source validation moved before secret gate
- `backend/tests/test_migration_tool.py` — AC12 cleanup patch target corrected

**Verification:** grep confirms both files listed in REPORT (lines 72-73), Independent REVIEW (line 41), and HANDOFF (lines 49-50). **PASS**.

---

## Actual Modified Files

1. `backend/scripts/migrate_sqlite_to_mysql.py` — source validation moved before secret gate (Defect 1)
2. `backend/tests/test_migration_tool.py` — AC12 cleanup patch target corrected to match import binding (Defect 2)

---

## Actual Execution Commands and Results

| Command | Exit Code | Result |
|---------|-----------|--------|
| `python -m py_compile backend/scripts/migrate_sqlite_to_mysql.py` | 0 | PASS |
| `python -m py_compile backend/tests/test_migration_tool.py` | 0 | PASS |
| `python scripts/migrate_sqlite_to_mysql.py --dry-run --source __missing__.db` | 1 | PASS: "Source SQLite database not found" before secret gate |
| `git diff --check -- backend/scripts/migrate_sqlite_to_mysql.py` | 0 | PASS (CRLF warning only) |
| `git diff --check -- backend/tests/test_migration_tool.py` | 0 | PASS (CRLF warning only) |

---

## Hard Gate Verification

| Gate | Status | Evidence |
|------|--------|----------|
| No MySQL connection | PASS | No `create_engine` calls with MySQL URL in changes |
| No secret reading | PASS | No `.env` file access, no `os.environ.get` for DB passwords |
| No destructive operations | PASS | No DROP/TRUNCATE/DELETE in changes |
| Partial diff preserved | PASS | Existing symmetric PK exclusion and cleanup restructuring intact |
| AST parse | PASS | `py_compile` passed for all modified files |
| Git diff --check | PASS | No trailing whitespace or tab issues |

---

## Risks

1. **Low:** Cleanup re-raise changes error propagation path. `cleanup_test_database()` now re-raises `OperationalError` instead of silently returning. Only called from `main()` cleanup mode and test `tearDownClass` — both handle exceptions.
2. **Low:** Validation order change affects control flow. The new three-way branch is clearer and prevents validator instantiation when table failures occurred. No functional change when all tables succeed.

---

## Unverified Items

1. **Real MySQL integration tests** (AC1-AC11) — Requires `REVID_TEST_MYSQL_ADMIN_URL` env var. Deferred to Unit C.
2. **End-to-end migration with real data** — Requires MySQL connection. Deferred to Unit C.
3. **Navicat manual acceptance** — Requires MySQL connection. Deferred to Unit C.

---

## Rollback and Cleanup Results

Not applicable — no data was written, no database was modified.

---

## Unit A Correction Verdict

**THREE PMC-IDENTIFIED DEFECTS CORRECTED — EVIDENCE CHAIN NOW CONSISTENT WITH REVISION -13**

| Defect | Status |
|--------|--------|
| Defect 1: Missing-source before secret gate | FIXED |
| Defect 2: AC12 cleanup patch wrong binding | FIXED |
| Defect 3: Evidence mismatch (both files) | FIXED |

All static verification passed. No MySQL connection, no secret reads, no destructive operations. Partial diff from previous revisions preserved.

This is evidence-only correction for revision `-13`, business attempt 1 continuation. **Unit B remains unauthorized until Codex PMC final acceptance of this revision `-13` evidence chain.**

---

## Inherited Failure Fingerprints

- `PROCESS_RETRY_EXHAUSTED: pid not alive crash after timeout` (from revision -08)
- `T4-002-SEMANTICS: IDEMPOTENCY_COMPARISON + FALSE_POSITIVE_CONFLICT + NON_MID_BATCH_ROLLBACK + SWALLOWED_CLEANUP + MISSING_SOURCE_COVERAGE`
- `T4-002-ATTEMPT1-STATIC: SECRET_BEFORE_SOURCE_VALIDATION + INEFFECTIVE_CLEANUP_PATCH_BINDING + CLEANUP_FAILURE_SWALLOWED`
- `T4-002-UNIT-A-PMC-REWORK: MISSING_SOURCE_STILL_SECRET_GATED + CLEANUP_PATCH_WRONG_BINDING + UNIT_A_EVIDENCE_MISMATCH` ← All three sub-defects now corrected.
