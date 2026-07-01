# T4-002 PMC Review — Unit C3 Revision 27 Rework Required

## Review Context

- Task: `T4-002 / UNIT-C3`
- Revision: `phase4-wave2-unit-c3-integrity-verification-2026-07-01-27`
- Execution state read: `REPORT_READY`
- Dispatcher: `t_ff560e29`, run `#131`, done
- Executor: `t_d97dcb15`, run `#132`, done
- REPORT: `ai/reports/REPORT-T4-002-UNIT-C3-REV27.md`
- REPORT SHA256: `7D563DAB654BAE2A690635203276A35667DB3B610F7CFD54B38B4A2F66342508`
- Independent REVIEW: missing by explicit rev27 authorization
- HANDOFF: missing by explicit rev27 authorization
- PMC decision time: `2026-07-01 15:24 +08:00`

## Authorization and Evidence Closure

Revision `-27` authorized exactly five real disposable-MySQL selectors, kept both business files read-only and stopped at `UNIT_C3_REPORT_READY_REV27`. The execution contract was respected: all selectors ran against `revid_test_t4_002`, no selector was skipped or replaced with a MySQL mock, the business-file diff is empty, and no secret exposure is evident.

The Acceptance Criteria did not pass: pytest returned `4 failed, 1 passed, 1 error`. Independent REVIEW and HANDOFF are required for final PASS, but are not needed to reject a revision whose own required verification is failing.

## Findings

| Check | Result |
|---|---|
| AC4 destination FK orphan detection | **FAIL** |
| AC6 12-table consistency | **FAIL** — contaminated by AC4 residue |
| AC10 same-PK different-value CLI failure | **FAIL** — arrange step collided with existing fixture row |
| AC11 partial rollback | PASS |
| AC12 cleanup-failure visibility | **FAIL** — invalid patch target; teardown also errored on locked SQLite file |
| Business files changed by rev27 | No |
| Secret exposed | No evidence |

The REPORT's statement that AC4 semantically proves FK-orphan detection is not supported by source inspection. `MigrationValidator.validate()` builds FK values from `src_rows`, then compares them with referenced IDs in MySQL. An orphan injected only into the MySQL target is therefore outside that check; the observed failure came from row-count and extra-PK checks, not the explicit FK-orphan branch.

AC6 is not independent because AC4 cleanup occurs after a failing assertion rather than in `finally`. AC10 assumes `user-001` is absent even though the shared class fixture already populated it. AC12 patches `test_migration_tool.cleanup_test_database`, which is not the collected module name in this invocation, and its failure path does not restore the disposable database. The final `PermissionError` additionally shows that SQLite resources are not deterministically released before `tearDownClass` removes the temp directory.

## PMC Verdict

`PMC_REWORK`

Revision `-27` is terminal business evidence and must not be redispatched, retried, unblocked or reused. The defects are bounded to the existing T4-002 migration validator and its tests, require no product, schema or security decision, and qualify for the single PMC-authorized business REWORK continuation.

Revision `-28` changes scope from read-only verification to bounded remediation. It is not an automatic retry and must use fresh cards and idempotency keys while inheriting every historical fingerprint.

## Failure Fingerprint

`UNIT_C3_REV27_DESTINATION_FK_AND_TEST_ISOLATION_FAILURE`

Contributing stable defects:

- `AC4_DESTINATION_ORPHAN_NOT_INSPECTED`
- `UNIT_C3_SHARED_DB_STATE_CONTAMINATION`
- `AC12_INVALID_PATCH_TARGET`
- `UNIT_C3_SQLITE_HANDLE_LEAK`

## Required Remediation

1. Validate FK orphan references from target-table FK values against target referenced IDs, with a message that identifies the child table/column and offending value.
2. Make AC4 cleanup unconditional and make every Unit C3 selector start from deterministic disposable-database state.
3. Arrange AC10's conflicting row without colliding during test setup, then prove the CLI returns non-zero and preserves the pre-existing target value.
4. Patch AC12 through the actual module object or stable local binding; always recreate/clean the disposable database after injected failure.
5. Close/dispose SQLite and SQLAlchemy resources before temp-directory removal and prove teardown has no error.
6. Rerun all five Unit C3 selectors together in the required order and obtain `5 passed`, `0 failed`, `0 skipped`, `0 errors` against real MySQL.

## Hermes Next Action

Consume only revision `phase4-wave2-unit-c3-integrity-remediation-2026-07-01-28` after it appears as the sole APPROVED Queue. Do not create an Independent Reviewer for revision `-27` and do not reuse its cards or keys.

## Human Decision

`NO` — this is a bounded implementation/test defect under the existing Task and ADR-003 authorization.
