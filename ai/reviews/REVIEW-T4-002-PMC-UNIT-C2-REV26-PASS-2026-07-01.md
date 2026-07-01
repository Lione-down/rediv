# T4-002 PMC Unit C2 Rev26 Final Acceptance

## Verdict

`PMC_PASS`

## Scope

- Task: `T4-002`
- Unit: `C2` — dry-run, full migration, second-run idempotency and source immutability
- Business revision: `phase4-wave2-unit-c2-ac3-stale-same-remediation-atomic-dispatch-2026-06-29-26`
- Lifecycle continuation: `phase4-wave2-unit-c2-rev26-review-dispatch-2026-06-30-26r2`
- Attempt: `1 continuation`

## Evidence Read

- Task: `ai/tasks/todo/TASK-T4-002-UNIT-C2-REV26.md`
- ADR: `ai/decisions/ADR-003-t4-002-disposable-mysql-test-environment.md`
- PLAN: `ai/tasks/doing/TASK-T4-002-UNIT-C2-REV26-PLAN.md`
- PROGRESS: `ai/tasks/doing/TASK-T4-002-UNIT-C2-REV26-PROGRESS.md`
- REPORT: `ai/reports/REPORT-T4-002-UNIT-C2-REV26.md`
- Independent REVIEW: `ai/reviews/REVIEW-T4-002-UNIT-C2-REV26.md`
- Canonical HANDOFF: `ai/handoffs/HANDOFF-T4-002-UNIT-C2-REV26-POST-REVIEW.md`
- Hermes execution status: `HANDOFF_READY`, Coordinator `t_ec30ad12`, Executor `t_9f24648e`, Reviewer `t_bcbc25b7`, HANDOFF `t_c481b6ad`

## Authorization and Lifecycle

- Revision `-26` business execution is terminal evidence and was not repeated.
- Revision `-26r1` remains terminal infrastructure evidence and was not reused.
- Revision `-26r2` used `REVIEW_DISPATCH_ONLY`, created one Independent Reviewer and one dependent HANDOFF stage, and stopped at `UNIT_C2_HANDOFF_READY_REV26`.
- REPORT, REVIEW and HANDOFF identify the same business revision, lifecycle continuation and Executor evidence card.

## Implementation and Scope Audit

- Current business implementation is in commit `47e1846c1ffb08fcba7b735e816102db7815a01d`.
- The scoped implementation adds `insert_rows`, excludes `stale_same` rows from INSERT, preserves the pre-write `stale_diff` abort, and keeps table-level transaction failure propagation.
- The scoped tests add stale-same-only and mixed new/stale-same coverage.
- Current working-tree diff for both business Allowed Files is empty. Unrelated project governance/runtime changes were observed and preserved.
- No schema, API, frontend or migration version change is part of this unit.

## Fresh PMC Verification

- Project backend virtual environment `py_compile`: PASS, exit `0`.
- Four scoped `TestUnitB` selectors: PASS, `4 passed in 0.46s`, exit `0`.
- Scoped `git diff --check`: PASS, exit `0`.
- Current PMC shell did not contain `REVID_TEST_MYSQL_ADMIN_URL`; PMC therefore did not repeat CREATE/DROP-capable tests. Independent Reviewer fresh-ran AC1/AC2/AC3/AC5 against only `revid_test_t4_002`: `4 passed in 1.65s`, `0` skipped, no MySQL mock substitution. Class teardown calls `cleanup_test_database()` and re-raises cleanup failures, so a completed PASS is evidence that cleanup did not fail.

## Acceptance Criteria Mapping

- stale-same-only and mixed selectors pass; source audit proves INSERT iterates only `insert_rows`.
- Real MySQL AC1/AC2/AC3/AC5 passed independently in Task order; second-run duplicate insertion no longer occurs.
- `stale_diff` still returns before writes; rollback exception propagation remains unchanged.
- REPORT/REVIEW/HANDOFF agree on database identity `revid_test_t4_002`, no `.env` fallback, no `revid_db` access and no secret value exposure.
- Scope is limited to the two Allowed Files plus authorized artifacts.

## Evidence Quality Note

The Executor REPORT abbreviates command lines instead of reproducing every Task flag and says “no database cleanup needed,” while the fixture actually drops the disposable database in `tearDownClass`. The Independent Reviewer supplied the exact selector semantics and a fresh successful class lifecycle whose cleanup failures are hard failures. This wording defect does not obscure behavior, database identity or cleanup outcome, so it is recorded as non-blocking and must not be copied into later REPORTs.

## Decision

Unit C2 revision `-26` satisfies this bounded unit's acceptance criteria and is finally accepted.

Next scope is Unit C3 only: same-PK conflict, FK orphan, partial rollback, 12-table consistency and cleanup failure visibility. T4-002 remains in progress; Unit D/E and T4-003 remain blocked.

