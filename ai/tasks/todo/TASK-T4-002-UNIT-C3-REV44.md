# TASK-T4-002-UNIT-C3-REV44 - Settings Env Acceptance for Real MySQL Verification

## Status

`REPORT_READY - REVIEW LIFECYCLE BLOCKED ON RUNTIME POLICY REMEDIATION`

## Queue Revision

`phase4-wave2-unit-c3-settings-env-acceptance-2026-07-08-44`

## Objective

Unblock the rev43 real-MySQL verification by making the backend settings schema accept the already authorized `REVID_TEST_MYSQL_ADMIN_URL` value when it is loaded from the project-local `.env`, without exposing credential material or changing production database behavior.

## Background

Rev43 direct implementation fixed the bounded cleanup lifecycle regressions in `backend/tests/test_migration_tool.py`; py_compile and the three non-MySQL Unit C3 regressions passed. Hermes then loaded `REVID_TEST_MYSQL_ADMIN_URL` from the project-local `.env` under Human Owner authorization and ran the five required real-MySQL selectors, but all five errored before database access because `backend/settings/config.py` rejects the `.env` key as an undeclared pydantic-settings input.

The current blocker is therefore not a missing secret and not a Hermes runtime dispatch failure. It is a narrow configuration acceptance gap for the test-only admin URL.

## Scope

- Allow `REVID_TEST_MYSQL_ADMIN_URL` to be present in the project-local `.env` without raising pydantic validation errors.
- Keep the existing migration/test contract that the actual admin URL is read from `os.environ["REVID_TEST_MYSQL_ADMIN_URL"]`.
- Re-run the exact rev43 five-selector real-MySQL verification after the settings fix.

## Non-goals

- Do not change migration semantics, cleanup lifecycle logic, schema, Alembic revisions, models, API behavior, frontend, Hermes runtime, or Kanban state.
- Do not print, persist, hash, infer, or otherwise expose the test admin URL, username, password, token, or any credential material.
- Do not touch `revid_db`; destructive operations remain limited to identity-confirmed disposable `revid_test_t4_002`.
- Do not create Independent REVIEW or HANDOFF.

## Allowed Files

Executor may modify:

- `backend/settings/config.py`

Executor may create:

- `ai/tasks/doing/TASK-T4-002-UNIT-C3-REV44-PLAN.md`
- `ai/tasks/doing/TASK-T4-002-UNIT-C3-REV44-PROGRESS.md`
- `ai/reports/REPORT-T4-002-UNIT-C3-REV44.md`

All other files are read-only for this revision.

## Required Fix

Add a minimal settings field for `REVID_TEST_MYSQL_ADMIN_URL`, preferably with representation suppressed, so pydantic-settings accepts the authorized `.env` key while avoiding accidental credential display in model repr. Do not introduce broad `extra="ignore"` unless the Executor proves the project already relies on that pattern and records the tradeoff.

## Required Verification

Run in order:

```powershell
backend\.venv\Scripts\python.exe -m py_compile backend\settings\config.py
```

Run a non-secret regression proving settings construction tolerates the test admin URL key without reading or printing the real `.env` value. A dummy value is sufficient.

Then run the exact rev43 required selector set in the authorized environment:

```powershell
backend\.venv\Scripts\python.exe -m pytest backend\tests\test_migration_tool.py::TestMigrationTool::test_ac4_fk_orphan_detected backend\tests\test_migration_tool.py::TestMigrationTool::test_ac6_consistency_report backend\tests\test_migration_tool.py::TestMigrationTool::test_ac10_conflict_nonzero_exit backend\tests\test_migration_tool.py::TestMigrationTool::test_ac11_partial_rollback backend\tests\test_migration_tool.py::TestMigrationTool::test_ac12_cleanup_failure_visible -q -p no:cacheprovider
```

Finally run:

```powershell
git diff --check -- backend/settings/config.py
```

## Acceptance Criteria

- `Settings()` no longer fails when `REVID_TEST_MYSQL_ADMIN_URL` is present in `.env` or process environment.
- The setting does not appear in repr output with credential material.
- The five real-MySQL selectors pass in one ordered run with `5 passed / 0 failed / 0 skipped / 0 errors`.
- Verification evidence records only non-secret facts: env loaded YES/NO, disposable database identity, exact command, exit code, pass/fail/skip/error counts, and no `revid_db` access.
- Only Allowed Files change; no Scope Drift, secret leakage, Reviewer/HANDOFF, historical card reuse, or unauthorized destructive action occurs.

## Failure Fingerprint Inheritance

Rev44 inherits:

- `REV43_WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION_NO_REPORT`
- `REV43_SETTINGS_REJECTS_TEST_MYSQL_ADMIN_URL_DOTENV`
- `REV42_REGRESSIONS_BYPASS_SHARED_LIFECYCLE_AND_FAILURE_GROUPING_INVALID`

## Stop Condition

Stop after writing rev44 PLAN, PROGRESS, REPORT and the required verification evidence. Return to PMC at `REPORT_READY`; PMC will decide whether Independent Review continuation is authorized.

## Revision 44r1 Review Lifecycle Authorization

PMC inspected the rev44 REPORT and actual `backend/settings/config.py` diff in `ai/reviews/REVIEW-T4-002-PMC-UNIT-C3-REV44-REVIEW-LIFECYCLE-2026-07-08.md` and authorized lifecycle-only Queue revision `phase4-wave2-unit-c3-rev44-review-dispatch-2026-07-08-44r1`.

`REVIEW_DISPATCH_ONLY` Coordinator contract:

- Profile: `revid-pm`; action marker: standalone `Action: REVIEW_DISPATCH_ONLY`.
- Read this Task, rev44 PLAN, PROGRESS, REPORT, Executor card `t_64a40afd`, execution status and actual business diff.
- Create exactly one `revid-reviewer` card and one dependent `revid-pm` `HANDOFF_ONLY` card, then complete immediately.
- Use fresh idempotency keys ending in `:review-dispatch`, `:review:0` and `:handoff:0`; do not reuse rev44 Dispatcher/Executor or any older card.
- Do not run tests, write project artifacts, modify business files or wait for Reviewer completion.

Independent Reviewer may create only:

- `ai/reviews/REVIEW-T4-002-UNIT-C3-REV44.md`

Reviewer must independently run the required checks, including the five real-MySQL selectors against only `revid_test_t4_002`, audit secret boundaries and Scope, and return exactly PASS, REWORK or BLOCKED.

Post-review `HANDOFF_ONLY` Coordinator may create only:

- `ai/handoffs/HANDOFF-T4-002-UNIT-C3-REV44-POST-REVIEW.md`

It may write that file only after Reviewer PASS and revision/attempt/card/evidence consistency checks. Stop after canonical `UNIT_C3_REV44_HANDOFF_READY`; wait for Codex PMC final acceptance.

## Revision 44r1 Runtime Advisory

Hermes ACKed rev44r1 and adopted Coordinator `t_a2509036`, but the Coordinator blocked before creating Reviewer/HANDOFF children with `ROLE_BOUNDARY_VIOLATION: terminal tool not allowed for revid-pm Kanban task`. PMC recorded this as runtime/profile boundary fingerprint `REV44R1_REVID_PM_ROLE_BOUNDARY_TERMINAL_TOOL_NOT_ALLOWED` in `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV44R1-2026-07-08.md`.

The rev44 implementation REPORT remains valid evidence, but final acceptance is still blocked because Independent REVIEW and HANDOFF are missing. No new Executor, business REWORK, Reviewer/HANDOFF, continuation revision, card operation, business file change, database access, or secret output is authorized until Hermes runtime owner provides a fresh diagnostic with `READY_FOR_CONTINUATION`.

## Revision 44r1 Runtime Diagnostic Review

Hermes produced `ai/reports/DIAGNOSTIC-T4-002-REV44R1-RUNTIME-HEALTH-2026-07-09.md`, SHA256 `050D2D9F3D1E7BDB997CE4CB4EA41C846511572E5E4D8D72BCBDF623FCC92F97`, with verdict `STILL_INFRA_BLOCKED`. PMC recorded `PMC_BLOCKED - RUNTIME_POLICY_REMEDIATION_REQUIRED` in `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-DIAGNOSTIC-REV44R1-2026-07-08.md`.

The diagnostic confirms `revid-pm / REVIEW_DISPATCH_ONLY` still lacks a proven least-privilege Kanban lifecycle capability path. It does not authorize continuation. Future unblock requires fresh runtime owner evidence with `READY_FOR_CONTINUATION`, including proof that one Reviewer child and one dependent `HANDOFF_ONLY` child can be created and terminalized without unrestricted terminal access, business writes, database access, secret output, or historical card reuse.
