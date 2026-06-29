# TASK-T4-002-UNIT-C2-REV25 — AC3 Remediation via Dedicated Dispatcher

## Status

`TERMINAL — PMC_BLOCKED / INFRASTRUCTURE_BLOCKED`

## Revision

`phase4-wave2-unit-c2-ac3-stale-same-remediation-dispatcher-2026-06-29-25`

## Authorization

Revision `-24` ended before Executor dispatch because the `revid-pm` Coordinator exceeded its 120s budget. Its business Objective, Scope, Non-goals, Allowed Files, Implementation Constraints, Hard Gates, Required Verification and Acceptance Criteria remain unchanged and are incorporated from `TASK-T4-002-UNIT-C2-REV24.md`.

Revision `-25` changes only the dispatch role from `revid-pm` to dedicated `revid-dispatcher`. It is a clean runtime continuation with fresh cards/keys and inherits every prior fingerprint.

## Terminal Runtime Evidence

Dispatcher `t_cc15e296` run `#122` timed out at `121s > 120s` and exhausted process retry `1/1`. It created child `t_25ac2145`, but the parent then `gave_up`; the child remains `todo`, has no run and is not a valid executable continuation. Rev25 PLAN, PROGRESS, REPORT, Independent REVIEW and HANDOFF are absent.

PMC verdict: `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV25-2026-06-29.md`. Revision `-25` and both cards are terminal evidence and must not be retried, claimed, promoted, unblocked, reparented, deleted or reused.

## Objective

Fix `migrate_table()` so identical existing `stale_same` rows never enter the INSERT execution set, while preserving same-PK different-value fail-closed behavior, rollback and report semantics.

## Allowed Files

Executor may modify only `backend/scripts/migrate_sqlite_to_mysql.py` and `backend/tests/test_migration_tool.py`.

Executor may create only the rev25 PLAN, PROGRESS and REPORT under their canonical `ai/tasks/doing/` and `ai/reports/` paths.

## Dispatcher Contract

Supervisor creates one `revid-dispatcher` card through `ai/runtime/create-hermes-coordinator.py`:

- Action: `DISPATCH_ONLY`
- Idempotency: `revid:phase4-wave2-unit-c2-ac3-stale-same-remediation-dispatcher-2026-06-29-25:T4-002:dispatch`
- Max runtime: `120s`; at most one process retry
- Executor profile: `revid-backend`

Dispatcher creates exactly one Executor child with current Dispatcher as parent, idempotency `revid:phase4-wave2-unit-c2-ac3-stale-same-remediation-dispatcher-2026-06-29-25:T4-002:execute:0`, max runtime `1800s` and at most one process retry. Its body must contain the revision/task path, two writable business files, three allowed rev25 artifacts, required verification, ADR-003 gates and prohibition on Reviewer/HANDOFF.

Dispatcher read-back verifies assignee, parent, revision, body, idempotency, runtime and retry policy, then completes immediately. It must not perform PM lifecycle work.

## Required Verification

Use the exact py_compile, two targeted Unit B selectors, ordered real-MySQL AC1/AC2/AC3/AC5 selectors and scoped `git diff --check` commands from revision `-24`.

Real MySQL verification may use only runtime `REVID_TEST_MYSQL_ADMIN_URL` and database `revid_test_t4_002`. Never read `.env`, print credentials or touch `revid_db`.

## Acceptance Criteria

- Unit stale-same-only and mixed new/stale-same evidence passes.
- Real disposable-MySQL AC1/AC2/AC3/AC5 all pass in fixed order; no skip/mock substitution.
- Existing identical rows are not inserted; new rows insert once; stale-diff aborts before writes.
- Report counts preserve inserted/stale_same/stale_diff/error meaning.
- No secret leak, unauthorized database access, Scope Drift or unknown business-file ownership.
- REPORT records exact commands, exit codes, pass/fail/skip counts, cleanup and unverified items.

## Failure Fingerprint Inheritance

Inherit all T4-002 fingerprints through revision `-24`, including `AC3_STALE_SAME_DUPLICATE_INSERT`, `REV23_COORDINATOR_MISSING_ACTION_MARKER`, `SUPERVISOR_BASH_POWERSHELL_VARIABLE_EXPANSION_AND_UNAUTHORIZED_FALLBACK` and `REV24_REVID_PM_PRE_DISPATCH_TIMEOUT`.

## Stop Condition

Stop at `UNIT_C2_AC3_REMEDIATION_REPORT_READY_REV25`. Executor must not create Reviewer/HANDOFF. At REPORT_READY, PMC decides the `revid-pm` review lifecycle continuation or bounded REWORK/BLOCKED outcome.
