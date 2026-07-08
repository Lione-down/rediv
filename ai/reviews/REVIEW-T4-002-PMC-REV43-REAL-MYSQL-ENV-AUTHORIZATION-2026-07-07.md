# REVIEW - T4-002 PMC Rev43 Real MySQL Env Authorization

## Verdict

`PMC_AUTHORIZED - REAL MYSQL VERIFICATION MAY LOAD LOCAL ENV`

## Revision

`phase4-wave2-unit-c3-shared-cleanup-lifecycle-correction-2026-07-07-43`

## Human Owner Instruction

At `2026-07-07T23:10:16+08:00`, Human Owner stated that if Hermes says env authorization is missing, then the authorization is granted.

Human Owner then clarified that the authorization specifically includes reading the project `.env` file, because that is where the account/password connection information is stored.

## Authorization Scope

Hermes or the authorized verifier may read the project-local `.env` file only to load `REVID_TEST_MYSQL_ADMIN_URL` into the current verification process. This authorizes exactly one ordered rev43 real-MySQL verification run:

```powershell
backend\.venv\Scripts\python.exe -m pytest backend\tests\test_migration_tool.py::TestMigrationTool::test_ac4_fk_orphan_detected backend\tests\test_migration_tool.py::TestMigrationTool::test_ac6_consistency_report backend\tests\test_migration_tool.py::TestMigrationTool::test_ac10_conflict_nonzero_exit backend\tests\test_migration_tool.py::TestMigrationTool::test_ac11_partial_rollback backend\tests\test_migration_tool.py::TestMigrationTool::test_ac12_cleanup_failure_visible -q -p no:cacheprovider
```

## Safety Boundaries

- Do not read any secret file other than the project-local `.env`.
- `.env` may be read only to load `REVID_TEST_MYSQL_ADMIN_URL` for this rev43 verification.
- Do not print, echo, persist, hash, or infer the URL, username, password, token, or any credential material.
- Do not touch `revid_db`.
- Destructive operations are allowed only after identity confirmation for disposable `revid_test_t4_002`, and only within that disposable database lifecycle.
- Do not create, retry, claim, promote, unblock, reparent, archive, or delete any Hermes card.
- Do not create Reviewer, HANDOFF, continuation revision, or next Task.
- Do not modify business code, migration code, Task scope, REPORT, REVIEW, HANDOFF, or database schema.

## Required Evidence

The verifier must record only non-secret evidence:

- Whether `REVID_TEST_MYSQL_ADMIN_URL` was loaded: `YES` or `NO`.
- Whether `.env` was used as the source: `YES` or `NO`, without recording its contents.
- Database identity confirmation for `revid_test_t4_002`, without credential material.
- Exact command, exit code, pass/fail/skip/error counts, and relevant non-secret pytest summary.
- Confirmation that no secret was output and `revid_db` was not touched.

## Decision Gate

If the five selectors pass with `5 passed / 0 failed / 0 skipped / 0 errors`, PMC may decide whether to publish an Independent Review continuation. If `.env` is missing, `REVID_TEST_MYSQL_ADMIN_URL` cannot be loaded, permissions are insufficient, identity is unclear, cleanup fails, or any selector fails/skips/errors, rev43 remains blocked with evidence.

## Current Codex Process

`REVID_TEST_MYSQL_ADMIN_URL_PRESENT=NO`

Codex did not read `.env` and did not run the real-MySQL selectors in this process.

## Human Decision

`YES - PROJECT LOCAL .env MAY BE READ ONLY TO LOAD REVID_TEST_MYSQL_ADMIN_URL FOR REV43 VERIFICATION`
