# REPORT-T5-093 - Restore legacy MySQL migration compatibility and local runtime

- Result: `DONE - PASS`
- Business delivery: `b23b6cb9d4354cc37a78b13352e95774a81f2b07`
- Date: 2026-07-18

## Outcome

The local Revid frontend and backend are running again. The runtime database is at the repository's single Alembic head `a3b4c5d6e7f8`, backend `/health` returns HTTP 200 on `127.0.0.1:8000`, and frontend root returns HTTP 200 on `127.0.0.1:5173`.

## Root cause and fix

The old runtime schema was healthy at `e1f2a3b4c5d6`. Startup first exposed two newly pending migrations. The first migration, `f2a3b4c5d6e7`, explicitly selected `utf8mb4` but omitted a collation; MySQL 8 therefore used `utf8mb4_0900_ai_ci` for the new table while the historical parent `users.id` remained `utf8mb4_unicode_ci`. MySQL correctly rejected the foreign key with error 3780.

The migration now queries `INFORMATION_SCHEMA.COLUMNS` and passes the exact parent collation as `mysql_collate`, matching the established repository pattern used by other FK migrations. No schema redesign or data rewrite was introduced.

## Verification

- RED: the new disposable-MySQL fixture deliberately converted `users` to a collation different from `@@default_collation_for_utf8mb4`; the pre-fix migration failed with the same MySQL 3780 fingerprint.
- GREEN: focused migration test passed `1/1`, reached `a3b4c5d6e7f8`, and verified `provider_cost_acknowledgements.user_id == users.id` collation.
- Adjacent regression: provider acknowledgement migration plus MySQL runtime cutover passed `13/13`.
- Static/migration gates: `py_compile` passed and `alembic heads` returned only `a3b4c5d6e7f8`.
- Authorized local migration: runtime moved from `e1f2a3b4c5d6` to `a3b4c5d6e7f8`.
- Runtime metadata: both relevant columns are `utf8mb4_unicode_ci`.
- Runtime readiness: backend `/health` and frontend root both returned HTTP 200.
- Hygiene: diff check, UTF-8/no-BOM, exact staging, sensitive-path, and secret-signature checks passed. `.env` was loaded only under explicit authorization and no value was printed or staged.

## Boundaries

No paid provider call, real generation, destructive database operation, downgrade, secret disclosure, or unrelated code change occurred. Untracked `.codex/`, `.hermes/plans/`, and `output/` remain user-owned and unstaged.
