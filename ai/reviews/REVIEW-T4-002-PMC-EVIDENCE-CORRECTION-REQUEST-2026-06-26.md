# REVIEW-T4-002 PMC — Evidence Correction Request

## Verdict

`PMC_EVIDENCE_CORRECTION_REQUIRED`

## Scope

This request handles the evidence-chain defects found after revision `phase4-wave2-unit-a-static-fixes-pmc-rework-2026-06-26-13`.

It does not authorize business code changes, Unit B dispatch, MySQL access, secrets, `.env`, CREATE/DROP/TRUNCATE/DELETE, migration writes, or attempt `2`.

## Why This Exists

PMC fresh verification accepted the code-level Unit A correction:

1. missing-source is checked before the secret gate;
2. AC12 patch binding targets the callable actually used by the test;
3. no MySQL, secret, `.env`, or destructive operation was used in PMC verification.

Final acceptance is still blocked because the formal evidence chain is stale or too permissive:

1. `ai/reports/REPORT-T4-002-UNIT-A.md` still declares revision `-12`.
2. `ai/handoffs/HANDOFF-T4-002-UNIT-A.md` still declares revision `-12` and says Unit B is ready.
3. `ai/reviews/REVIEW-T4-002-UNIT-A-INDEPENDENT-CORRECTION.md` detects the stale evidence but marks it non-blocking and gives PASS.

## Required Correction Artifacts

Hermes/revid-pm must produce fresh revision `-13` evidence without editing the old revision `-12` evidence in place.

Required new or clearly additive artifacts:

1. `ai/reports/REPORT-T4-002-UNIT-A-CORRECTION-REV13.md`
   - Must identify Queue revision `phase4-wave2-unit-a-static-fixes-pmc-rework-2026-06-26-13`.
   - Must identify business attempt `1` continuation.
   - Must state this is evidence-only correction, not attempt `2`.
   - Must list both allowed files:
     - `backend/scripts/migrate_sqlite_to_mysql.py`
     - `backend/tests/test_migration_tool.py`
   - Must not claim Unit B is authorized.

2. `ai/reviews/REVIEW-T4-002-UNIT-A-INDEPENDENT-CORRECTION-REV13-ADDENDUM.md`
   - Must review the fresh revision `-13` REPORT and HANDOFF.
   - Must explicitly acknowledge that stale revision evidence is blocking for PMC final acceptance.
   - Must not reuse the earlier non-blocking classification for revision mismatch.
   - May PASS only if REPORT, REVIEW and HANDOFF point to the same revision and attempt.

3. `ai/handoffs/HANDOFF-T4-002-UNIT-A-CORRECTION-REV13.md`
   - Must identify Queue revision `phase4-wave2-unit-a-static-fixes-pmc-rework-2026-06-26-13`.
   - Must identify business attempt `1` continuation.
   - Must state Unit A correction is ready for Codex PMC re-review only.
   - Must state Unit B remains unauthorized until PMC PASS.

4. Hermes execution status update
   - Must point PMC Evidence Paths to the fresh revision `-13` correction artifacts.
   - Must explain whether `Handoff Card | NONE` is expected; if not expected, provide the correct handoff card/result.
   - Must correct or explain the `2026-06-27 09:58:00 UTC` timestamp anomaly.

## Prohibitions

- Do not modify business code for this evidence repair.
- Do not overwrite revision `-12` evidence as if it were revision `-13`.
- Do not dispatch Unit B.
- Do not create attempt `2`.
- Do not read or print secrets.
- Do not run destructive database operations.
- Do not use a new Queue revision to erase inherited failure fingerprints.

## PMC Re-review Gate

PMC can re-run final acceptance only when the fresh revision `-13` REPORT, Independent REVIEW addendum, HANDOFF, and Hermes execution status all refer to the same revision and business attempt.
