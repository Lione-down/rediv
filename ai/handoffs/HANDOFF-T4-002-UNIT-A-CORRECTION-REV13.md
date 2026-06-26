# HANDOFF-T4-002 Unit A Correction — Revision -13

## Queue Revision
`phase4-wave2-unit-a-static-fixes-pmc-rework-2026-06-26-13`

## Task ID
T4-002

## Unit
A (Static Fixes Correction)

## Business Attempt Ordinal
1 (continuation — NOT attempt 2)

## Handoff Date
2026-06-26

---

## Unit A Correction Summary

This handoff covers the **revision `-13` correction** of Unit A static fixes. It supersedes the revision `-12` handoff (`HANDOFF-T4-002-UNIT-A.md`).

Three PMC-identified defects were corrected:

1. **Missing-source before secret gate** (`backend/scripts/migrate_sqlite_to_mysql.py`): Source file existence/stat validation moved BEFORE the `REVID_TEST_MYSQL_ADMIN_URL` secret gate. Error is now "Source SQLite database not found" instead of "REVID_TEST_MYSQL_ADMIN_URL is not set".

2. **AC12 cleanup patch binding** (`backend/tests/test_migration_tool.py`): Patch target corrected from `"scripts.migrate_sqlite_to_mysql.cleanup_test_database"` to `"test_migration_tool.cleanup_test_database"` to match the direct import binding.

3. **Evidence mismatch**: All revision `-13` correction artifacts accurately cover both allowed files.

---

## Evidence Produced

| Artifact | Path | Revision |
|----------|------|----------|
| REPORT | `ai/reports/REPORT-T4-002-UNIT-A-CORRECTION-REV13.md` | `-13` |
| Independent REVIEW | `ai/reviews/REVIEW-T4-002-UNIT-A-INDEPENDENT-CORRECTION-REV13-ADDENDUM.md` | `-13` |
| HANDOFF | This file | `-13` |
| Previous REPORT (superseded) | `ai/reports/REPORT-T4-002-UNIT-A.md` | `-12` (do not use for acceptance) |
| Previous HANDOFF (superseded) | `ai/handoffs/HANDOFF-T4-002-UNIT-A.md` | `-12` (do not use for acceptance) |
| Previous Independent REVIEW (superseded) | `ai/reviews/REVIEW-T4-002-UNIT-A-INDEPENDENT-CORRECTION.md` | `-12` (classification superseded by addendum) |

---

## Static Verification Results

| Check | Result |
|-------|--------|
| AST parse (migrate script) | PASS |
| AST parse (test file) | PASS |
| Git diff --check | PASS (CRLF warning only) |
| No MySQL connection | CONFIRMED |
| No secret reads | CONFIRMED |
| No destructive operations | CONFIRMED |
| Partial diff preserved | YES |

---

## Modified Files

- `backend/scripts/migrate_sqlite_to_mysql.py` — source validation moved before secret gate (Defect 1)
- `backend/tests/test_migration_tool.py` — AC12 cleanup patch target corrected (Defect 2)

---

## Inherited Failure Fingerprints

- `PROCESS_RETRY_EXHAUSTED: pid not alive crash after timeout`
- `T4-002-SEMANTICS: IDEMPOTENCY_COMPARISON + FALSE_POSITIVE_CONFLICT + NON_MID_BATCH_ROLLBACK + SWALLOWED_CLEANUP + MISSING_SOURCE_COVERAGE`
- `T4-002-ATTEMPT1-STATIC: SECRET_BEFORE_SOURCE_VALIDATION + INEFFECTIVE_CLEANUP_PATCH_BINDING + CLEANUP_FAILURE_SWALLOWED`
- `T4-002-UNIT-A-PMC-REWORK: MISSING_SOURCE_STILL_SECRET_GATED + CLEANUP_PATCH_WRONG_BINDING + UNIT_A_EVIDENCE_MISMATCH` ← All three sub-defects now corrected

---

## Handoff Status

**READY FOR CODEX PMC FINAL ACCEPTANCE**

Unit A correction revision `-13` is complete. All three PMC-identified defects are fixed. Evidence chain is revision-consistent (all artifacts reference revision `-13`).

**Unit B remains UNAUTHORIZED until Codex PMC provides final acceptance of this revision `-13` evidence chain.**

No Unit B dispatch, no attempt 2, no MySQL, no secrets, no destructive operations are authorized by this handoff.
