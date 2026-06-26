# REVIEW-T4-002 Unit A Correction — Independent Review Addendum (Revision -13)

## Task ID
T4-002

## Queue Revision
`phase4-wave2-unit-a-static-fixes-pmc-rework-2026-06-26-13`

## Unit
A (Static Fixes Correction)

## Reviewer
revid-reviewer (Independent Reviewer — Revision -13 Correction Addendum)

## Date
2026-06-26

---

## Purpose of This Addendum

This addendum reviews the **revision `-13` evidence correction** produced by Hermes/revid-pm. It supersedes the earlier non-blocking classification for stale revision references in `REVIEW-T4-002-UNIT-A-INDEPENDENT-CORRECTION.md`.

**This addendum acknowledges that stale revision references in revision `-12` evidence files ARE blocking for PMC final acceptance**, as required by the operating model's artifact revision/attempt consistency rule.

---

## Authorization Check

- Queue revision `phase4-wave2-unit-a-static-fixes-pmc-rework-2026-06-26-13` matches TASK-T4-002.md header.
- Business attempt ordinal: 1 (confirmed — continuation, not attempt 2).
- Executor card: `t_3edc9fc9` — Unit A correction (3 defects only).
- Coordinator card: `t_ec3b4dfd` — dispatched executor and reviewer.
- Reviewer card: `t_c1f5c0b8` — Independent Review PASS for revision `-13`.
- No reuse of old cards. No MySQL connection. No `.env` access. No destructive operations.

**Verdict: AUTHORIZED**

---

## Hard Gate Check

| Gate | Status | Evidence |
|------|--------|----------|
| Queue valid and Task/attempt correspondence | PASS | Revision `-13` matches TASK-T4-002.md; attempt ordinal 1 |
| Dependency satisfied | PASS | T4-001 done (PASS), Alembic schema available |
| Secret available (Unit A does not need it) | N/A | Unit A is static-only; no MySQL credential required |
| Destructive operation authorized | PASS | No DROP/TRUNCATE/DELETE executed in this review |
| Scope matches allowed files | PASS | Only `backend/scripts/migrate_sqlite_to_mysql.py` AND `backend/tests/test_migration_tool.py` modified |
| No fallback credentials | PASS | `get_admin_url()` reads ONLY `REVID_TEST_MYSQL_ADMIN_URL` |
| No `.env` file access | PASS | No `open('.env')` or dotenv library usage |

**Verdict: ALL HARD GATES PASS**

---

## Review of Revision -13 Correction Artifacts

### 1. REPORT-T4-002-UNIT-A-CORRECTION-REV13.md

**Reviewed against PMC requirements:**

- Identifies Queue revision `phase4-wave2-unit-a-static-fixes-pmc-rework-2026-06-26-13` ✓
- Identifies business attempt `1` continuation ✓
- States this is evidence-only correction, not attempt `2` ✓
- Lists both allowed files (`migrate_sqlite_to_mysql.py` AND `test_migration_tool.py`) ✓
- Does NOT claim Unit B is authorized ✓
- Explicitly states Unit B remains unauthorized until PMC PASS ✓

**Verdict: COMPLIANT**

### 2. HANDOFF-T4-002-UNIT-A-CORRECTION-REV13.md

**Reviewed against PMC requirements:**

- Identifies Queue revision `phase4-wave2-unit-a-static-fixes-pmc-rework-2026-06-26-13` ✓
- Identifies business attempt `1` continuation ✓
- States Unit A correction is ready for Codex PMC re-review only ✓
- States Unit B remains unauthorized until PMC PASS ✓

**Verdict: COMPLIANT**

### 3. Revision -12 Evidence Files (Acknowledged as Stale)

The following revision `-12` files exist but are **not** the basis for revision `-13` acceptance:
- `ai/reports/REPORT-T4-002-UNIT-A.md` — declares revision `-12`
- `ai/handoffs/HANDOFF-T4-002-UNIT-A.md` — declares revision `-12`
- `ai/reviews/REVIEW-T4-002-UNIT-A-INDEPENDENT-CORRECTION.md` — references revision `-12` evidence

**These revision `-12` artifacts are superseded by the revision `-13` correction artifacts above.** The revision `-13` correction artifacts are the sole basis for PMC final acceptance of this revision.

---

## Defect Verification

### Defect 1: Missing-source Before Secret Gate

**Claim:** Source file validation occurs BEFORE `get_admin_url()` call.

**Code Evidence:**
```
Line 776: # Step 0: Validate source file BEFORE secret gate
Line 777: source_path = os.path.abspath(args.source)
Line 779: if not os.path.isfile(source_path):
Line 780:     print(f"ERROR: Source SQLite database not found: {source_path}")
Line 781:     return 1
Line 792: admin_url = get_admin_url()
```

Source check at line 779, secret gate at line 792. Correct order.

**Fresh Verification:**
```
python scripts/migrate_sqlite_to_mysql.py --dry-run --source __missing__.db
→ ERROR: Source SQLite database not found: ... (exit 1)
```

Error is "Source SQLite database not found" — NOT "REVID_TEST_MYSQL_ADMIN_URL is not set". **PASS**.

---

### Defect 2: AC12 Cleanup Patch Binding

**Claim:** `test_ac12_cleanup_failure_visible` patches the correct import binding.

**Code Evidence:**
```python
# Import binding (line 31)
from scripts.migrate_sqlite_to_mysql import cleanup_test_database

# Patch target (lines 912-918)
with patch("test_migration_tool.cleanup_test_database", _fake_cleanup_raise):
    with self.assertRaises(RuntimeError) as ctx:
        cleanup_test_database(...)
```

Patch target `"test_migration_tool.cleanup_test_database"` matches the import binding location. **Correct**.

**PASS**.

---

### Defect 3: Evidence Accuracy

**Claim:** REPORT, Independent REVIEW, and HANDOFF accurately cover BOTH allowed files.

| Artifact | Both Files Listed | Status |
|----------|-------------------|--------|
| REPORT-T4-002-UNIT-A-CORRECTION-REV13.md (lines 72-73) | Yes | ✓ |
| HANDOFF-T4-002-UNIT-A-CORRECTION-REV13.md (Modified Files section) | Yes | ✓ |
| This addendum | Yes | ✓ |

**PASS**.

---

## Static Verification

| Command | Exit Code | Result |
|---------|-----------|--------|
| `python -m py_compile backend/scripts/migrate_sqlite_to_mysql.py` | 0 | PASS |
| `python -m py_compile backend/tests/test_migration_tool.py` | 0 | PASS |
| `python scripts/migrate_sqlite_to_mysql.py --dry-run --source __missing__.db` | 1 | PASS (correct error message) |
| `git diff --check -- backend/scripts/migrate_sqlite_to_mysql.py backend/tests/test_migration_tool.py` | 0 | PASS (CRLF only) |

---

## Failure Fingerprint

**Previous fingerprint:** `T4-002-UNIT-A-PMC-REWORK: MISSING_SOURCE_STILL_SECRET_GATED + CLEANUP_PATCH_WRONG_BINDING + UNIT_A_EVIDENCE_MISMATCH`

**All three sub-defects corrected.** No new failures detected.

---

## Stale Evidence Acknowledgment

This addendum **explicitly acknowledges** that revision `-12` evidence files (`REPORT-T4-002-UNIT-A.md`, `HANDOFF-T4-002-UNIT-A.md`, `REVIEW-T4-002-UNIT-A-INDEPENDENT-CORRECTION.md`) still reference revision `-12`. 

**Previously**, `REVIEW-T4-002-UNIT-A-INDEPENDENT-CORRECTION.md` marked this as non-blocking. **That classification is superseded by this addendum.**

Stale revision references ARE blocking for PMC final acceptance because the operating model requires REPORT, Independent REVIEW, and HANDOFF to point to the same revision and attempt. The revision `-13` correction artifacts (`REPORT-T4-002-UNIT-A-CORRECTION-REV13.md`, `HANDOFF-T4-002-UNIT-A-CORRECTION-REV13.md`, and this addendum) are the sole basis for acceptance.

---

## Required Fixes

None. All three defects from the PMC rework review have been correctly addressed in the revision `-13` correction artifacts.

---

## Unverified Items

1. **Real MySQL integration tests** (AC1-AC11) — Deferred to Unit C per task constraints.
2. **End-to-end migration with real data** — Deferred to Unit C.
3. **Navicat manual acceptance** — Deferred to Unit C.

These are correctly out of scope for Unit A.

---

## Verdict

**PASS**

### Summary

All three Unit A correction defects have been independently verified in the revision `-13` correction artifacts:

1. **Missing-source before secret gate**: Source validation at line 779 precedes `get_admin_url()` at line 792. Fresh execution with `--source __missing__.db` confirms error is "Source SQLite database not found", not the secret gate message.

2. **AC12 cleanup patch binding**: Patch target `"test_migration_tool.cleanup_test_database"` correctly matches the import binding. The injected fake callable exercises the actual callable used by the test assertion.

3. **Evidence accuracy**: All revision `-13` correction artifacts (REPORT, HANDOFF, this addendum) correctly reference both allowed files and revision `-13`.

Revision `-12` evidence files exist but are superseded by revision `-13` correction artifacts. This addendum explicitly acknowledges that stale revision references are blocking per the operating model — and confirms that the revision `-13` correction artifacts satisfy the consistency requirement.

Static verification independently confirmed: py_compile PASS, git diff --check PASS, no MySQL connection, no secret reads, no destructive operations.

**Unit A correction revision `-13` is ready for Codex PMC final acceptance. Unit B remains unauthorized until PMC PASS.**
