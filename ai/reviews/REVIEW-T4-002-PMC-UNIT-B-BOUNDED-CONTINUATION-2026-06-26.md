# T4-002 PMC Unit B Bounded Continuation Approval

## Verdict

`PMC APPROVED — fresh bounded Unit B continuation revision -15`

## Queue Revision

`phase4-wave2-unit-b-unit-tests-bounded-continuation-2026-06-26-15`

## Basis

- Unit A correction revision `-13` has PMC PASS.
- Unit B revision `-14` is not reusable: Coordinator `t_bbbf72bd` timed out at 302s > 300s and Executor `t_7275328d` timed out at 847s/848s > 800s, with retries exhausted.
- Runtime diagnostic `ai/reports/DIAGNOSTIC-T4-002-RUNTIME-OWNER-REV14-2026-06-26.md` shows the Unit B test target is fast locally (`TestUnitB` passed in under one second) and the blocker was runtime/dispatcher completion, not business-test duration.
- Gateway has been restored, but old revision `-14` remains terminal and must not be retried, promoted, unblocked, claimed, reused, or treated as completion evidence.

## Approved Scope

This revision is a fresh bounded continuation for Unit B only:

- Task: `T4-002`
- Business attempt ordinal: still `1` continuation, not attempt `2`
- Unit: B — same-PK conflict and partial rollback unit-test semantics
- Executor profile: `revid-backend`
- Reviewer profile: `revid-reviewer`
- Required completion chain: completed Executor card, Independent REVIEW, HANDOFF, then PMC final acceptance

## Allowed Commands

Executor should keep verification minimal and deterministic:

```powershell
python -m py_compile backend/scripts/migrate_sqlite_to_mysql.py
python -m py_compile backend/tests/test_migration_tool.py
python -m pytest backend/tests/test_migration_tool.py::TestUnitB -q
git diff --check -- backend/scripts/migrate_sqlite_to_mysql.py backend/tests/test_migration_tool.py
```

## Allowed Files

Business file edits are not expected. If the Executor finds the current Unit B tests already present and passing, it should only update Unit B `-15` evidence artifacts.

Allowed artifact files:

- `ai/tasks/doing/TASK-T4-002-UNIT-B-REV15-PLAN.md`
- `ai/tasks/doing/TASK-T4-002-UNIT-B-REV15-PROGRESS.md`
- `ai/reports/REPORT-T4-002-UNIT-B-REV15.md`
- `ai/reviews/REVIEW-T4-002-UNIT-B-REV15.md`
- `ai/handoffs/HANDOFF-T4-002-UNIT-B-REV15.md`

Allowed business files only if strictly needed for the same Unit B scope:

- `backend/scripts/migrate_sqlite_to_mysql.py`
- `backend/tests/test_migration_tool.py`

## Prohibited Actions

- No MySQL connection.
- No secret reads.
- No `.env` access.
- No CREATE, DROP, TRUNCATE, DELETE, migration write, or destructive operation.
- No Unit C, D, E work.
- No attempt `2`.
- No retry, promote, unblock, claim, or reuse of revision `-14` cards or older cards.
- No use of `REPORT-T4-002-UNIT-B.md` as final completion evidence unless the fresh `-15` chain independently verifies and references it.

## Required Acceptance Evidence

Executor REPORT must include:

- Revision `phase4-wave2-unit-b-unit-tests-bounded-continuation-2026-06-26-15`
- Attempt `1` continuation statement
- Inherited failure fingerprints
- Exact commands and exit codes
- `TestUnitB` result count
- Confirmation of no MySQL, no secrets, no `.env`, no destructive operations

Independent REVIEW must verify:

- Same revision `-15`
- Same scoped evidence paths
- No stale `-14` card reuse
- Completed Executor chain exists
- Unit B tests passed via the minimal target

HANDOFF must state:

- `UNIT_B_HANDOFF_READY_REV15`
- Unit C remains unauthorized until PMC final PASS

## Next Gate

PMC final acceptance is required before Unit C, T4-003, or T4-010 can proceed.
