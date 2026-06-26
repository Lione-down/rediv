# T4-002 PMC Review — Bounded Work Unit Split Approval

## Review Context

- Task: T4-002 — SQLite -> MySQL data migration tool
- Previous Queue revision: `phase4-wave2-final-attempt-continuation-2026-06-25-10`
- New Queue revision: `phase4-wave2-unit-a-static-fixes-2026-06-25-11`
- Execution state read: `EXECUTOR_CRASHED_PARENT_BLOCKED`
- Runtime diagnostic reviewed: `ai/reports/DIAGNOSTIC-T4-002-RUNTIME-OWNER-REV10-2026-06-25.md`
- PMC request reviewed: `ai/reports/PMC-REQUEST-T4-002-BOUNDED-WORK-UNIT-SPLIT-2026-06-25.md`
- PMC decision time: `2026-06-25 22:40:47 +08:00`

## Evidence Cursor

| Item | Value |
|---|---|
| Queue revision before decision | `phase4-wave2-final-attempt-continuation-2026-06-25-10` |
| Execution state | `EXECUTOR_CRASHED_PARENT_BLOCKED` |
| Execution last transition | `2026-06-25T17:00:00+08:00` |
| Diagnostic hash | `80D7FDF0B3F3524A3FF519CB35C8F694DB1E071D012F81374800FF760B3A8EA3` |
| Request hash | `FB07EED28DC9A51678AC62B23130C9B0407A3734569808D0C644792E7E47E6D1` |
| Report path/hash | `PENDING` |
| Independent review path/hash | `PENDING` |
| Handoff path/hash | `PENDING` |
| Failure fingerprint | `PROCESS_RETRY_EXHAUSTED` + `T4-002-SEMANTICS` + `T4-002-ATTEMPT1-STATIC` + `COORDINATOR_TIMEOUT_DEADLOCK` |

## Diagnostic Assessment

Hermes runtime owner supplied the evidence requested by the revision `-10` PMC advisory:

- The requested 1800s runtime budget was not applied by the dispatcher.
- The Coordinator consumed the 900s budget while monitoring the Executor and timed out.
- The Executor then crashed and could not claim retry because the parent Coordinator state produced a `parents_not_done` rejection.
- No REPORT, Independent REVIEW, or HANDOFF exists for revision `-10`; there is no acceptance evidence.
- Same-profile non-destructive smoke proof was provided and did not touch secrets or business databases.

The evidence supports treating revision `-10` as an infrastructure/runtime blocked chain for queue purposes. It does not support PMC PASS, business REWORK attempt `2`, or manual recovery of the old cards.

## PMC Decision

**PMC_APPROVED — BOUNDED WORK UNIT SPLIT, UNIT A ONLY**

PMC approves the bounded work unit execution model for T4-002, with sequential Units A-E. This approval does not complete T4-002 and does not approve all units for execution at once.

Only Unit A is approved as the next executable Queue revision.

## Unit A Authorization

- Revision: `phase4-wave2-unit-a-static-fixes-2026-06-25-11`
- Business attempt ordinal: still `1`; this is a continuation, not attempt `2`.
- Executor profile: `revid-backend`
- Reviewer profile: `revid-reviewer`
- Coordinator lifecycle: short-lived dispatch; target completion within 120s after dispatch; Coordinator must not monitor Executor heartbeats until timeout.
- Scope: static fixes only, no MySQL connection required.
- Allowed business files:
  - `backend/scripts/migrate_sqlite_to_mysql.py`
  - `backend/tests/test_migration_tool.py`
- Required attempt artifacts:
  - `ai/tasks/doing/TASK-T4-002-UNIT-A-PLAN.md`
  - `ai/tasks/doing/TASK-T4-002-UNIT-A-PROGRESS.md`
  - `ai/reports/REPORT-T4-002-UNIT-A.md`
  - `ai/reviews/REVIEW-T4-002-UNIT-A.md`
  - `ai/handoffs/HANDOFF-T4-002-UNIT-A.md`

## Unit A Required Fixes

Unit A must address or explicitly prove fixed these five defects:

1. Missing-source validation must not be gated behind MySQL secret setup.
2. Cleanup failure injection must patch the actual callable binding used by tests.
3. `_setup_test_db()` and related setup/cleanup code must not swallow `RuntimeError` / `ConnectionError` in a way that hides cleanup or identity failures.
4. Same-PK different-value comparison must not silently overwrite or misclassify existing rows.
5. Partial rollback tests must be prepared so later Unit B can prove mid-batch rollback with a real post-first-row failure.

## Unit A Verification Gates

Unit A must run and report:

- Python AST parse for both allowed Python files.
- `git diff --check`.
- Targeted non-MySQL unit checks for missing-source / validation ordering and cleanup failure visibility where available.
- Explicit evidence that no MySQL credential, `.env` fallback, `CREATE DATABASE`, `DROP DATABASE`, migration write, or destructive database operation was used.

If the local backend environment cannot run targeted tests, Unit A REPORT must mark that verification as blocked with exact command, error, and impact. It may not claim PASS from static inspection alone.

## Units B-E

The following units are accepted as the intended sequence, but each later executable revision still requires a fresh PMC Queue decision after prior evidence is available:

| Unit | Scope | MySQL Required | Gate |
|---|---|---:|---|
| B | Same-PK and rollback unit tests | No | Requires Unit A REPORT/REVIEW/HANDOFF |
| C | Disposable MySQL integration tests | Yes | Requires Unit B PASS evidence and ADR-003 gates |
| D | Consolidated T4-002 REPORT | No | Requires Unit C evidence |
| E | Independent REVIEW and HANDOFF | No | Requires Unit D REPORT |

## Restrictions Preserved

- No attempt `2`.
- Do not clear or replace inherited failure fingerprints.
- Do not reuse revision `-08`, `-10`, or older Coordinator/Executor/Reviewer cards.
- Do not manually claim, promote, unblock, or retry Hermes cards.
- Do not modify `HERMES-EXECUTION-STATUS.md` from PMC.
- Do not touch frontend, API contracts, migrations, user database, secrets, or `.env`.
- Do not advance T4-003 or T4-010 from this approval.

## PMC Verdict

`PMC_APPROVED_UNIT_A — DISPATCH BOUNDED STATIC FIXES`

## Hermes Next Action

Consume Queue revision `phase4-wave2-unit-a-static-fixes-2026-06-25-11`, create a fresh short-lived Coordinator, dispatch Unit A Executor, and stop after Unit A HANDOFF_READY for Codex PMC review.

