# T4-002 PMC Review — Unit A Correction PASS

## Review Context

- Task: T4-002 — SQLite -> MySQL data migration tool
- Queue revision reviewed: `phase4-wave2-unit-a-static-fixes-pmc-rework-2026-06-26-13`
- Execution state read: `PMC_BLOCKED (WAITING FOR FINAL ACCEPTANCE)`
- Coordinator card: `t_ec3b4dfd`
- Executor card: `t_3edc9fc9`
- Reviewer card: `t_c1f5c0b8`
- REPORT: `ai/reports/REPORT-T4-002-UNIT-A-CORRECTION-REV13.md`
- Independent REVIEW addendum: `ai/reviews/REVIEW-T4-002-UNIT-A-INDEPENDENT-CORRECTION-REV13-ADDENDUM.md`
- HANDOFF: `ai/handoffs/HANDOFF-T4-002-UNIT-A-CORRECTION-REV13.md`
- PMC decision time: `2026-06-26 22:00 +08:00`

## Evidence Cursor

| Item | Value |
|---|---|
| Queue revision | `phase4-wave2-unit-a-static-fixes-pmc-rework-2026-06-26-13` |
| Execution state | `PMC_BLOCKED (WAITING FOR FINAL ACCEPTANCE)` |
| Execution last transition | `2026-06-26 22:00:00 UTC` |
| Queue hash | `1417C0E0A9EC1B84DDB5B9B4093BCBC15A76D7CB46C1755358BFB90C9EA6FDAB` |
| Execution status hash | `2911326BFB0C15A08D065748CE6EA679A0CDE0E91E882FF50B412E3216AC6793` |
| Report hash | `4811DDB6723A3EBAD1176EAE6B08CEE28AA0E9D284DC99B7B3610C4EDB6F21C9` |
| Review hash | `D8591AF2B4F2139C2A91754BE637181C6C6311D3771F6D6214146D35D74C3B4E` |
| Handoff hash | `3B0C8AAFDF1C833EDD68EC449FBBA48C1F24E9A4D07E4F586E46153BD53586C8` |
| Previous failure fingerprint | `T4-002-UNIT-A-PMC-REWORK: MISSING_SOURCE_STILL_SECRET_GATED + CLEANUP_PATCH_WRONG_BINDING + UNIT_A_EVIDENCE_MISMATCH` |

## Authorization

Revision `-13` was authorized only for Unit A correction:

1. missing-source validation before the MySQL secret gate;
2. AC12 cleanup failure injection patch binding;
3. revision-consistent Unit A correction evidence.

No Unit B implementation, MySQL connection, secret read, `.env` access, CREATE/DROP/TRUNCATE/DELETE, migration write, attempt `2`, or business-code work outside the two allowed files was authorized by revision `-13`.

## Fresh PMC Verification

PMC ran fresh non-destructive checks:

| Check | Result | Evidence |
|---|---|---|
| `python -m py_compile backend\scripts\migrate_sqlite_to_mysql.py backend\tests\test_migration_tool.py` | PASS | Both files compile |
| Missing source before secret gate | PASS | `cd backend; python scripts\migrate_sqlite_to_mysql.py --dry-run --source __pmc_missing_source_rev13__.db` returned `ERROR: Source SQLite database not found` before any secret-gate message |
| `git diff --check -- backend/scripts/migrate_sqlite_to_mysql.py backend/tests/test_migration_tool.py ...revision-13 evidence files...` | PASS | Exit 0; Windows CRLF warning only |
| AC12 patch binding static check | PASS | `test_ac12_cleanup_failure_visible()` patches `test_migration_tool.cleanup_test_database`, matching the direct import binding used by the assertion |
| Evidence chain consistency | PASS | REPORT, Independent REVIEW addendum and HANDOFF all identify revision `phase4-wave2-unit-a-static-fixes-pmc-rework-2026-06-26-13` and business attempt `1` continuation |

## Findings

No blocking findings remain for Unit A correction.

Revision `-12` REPORT/REVIEW/HANDOFF remain stale and must not be used for acceptance. The revision `-13` correction REPORT, Independent REVIEW addendum and HANDOFF explicitly supersede that stale evidence and keep Unit B unauthorized until this PMC decision.

## PMC Verdict

`PMC_PASS_UNIT_A_CORRECTION`

Unit A correction revision `-13` is accepted. This is not full T4-002 completion and does not unblock T4-003.

PMC approves the next bounded work unit:

- New Queue revision: `phase4-wave2-unit-b-unit-tests-2026-06-26-14`
- Scope: Unit B same-PK and rollback unit-test semantics only.
- MySQL required: No.
- Destructive operations: Not authorized.
- Business attempt ordinal: still `1` continuation; attempt `2` remains prohibited.

## Hermes Next Action

Consume only Queue revision `phase4-wave2-unit-b-unit-tests-2026-06-26-14`.

Hermes must create a fresh short-lived Coordinator, dispatch the Unit B Executor and Reviewer, and stop after Unit B HANDOFF_READY for Codex PMC review. Do not reuse old cards, do not run Unit C, do not access MySQL secrets, and do not perform destructive database operations.
