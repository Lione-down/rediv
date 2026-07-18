# TASK-T5-093 - Restore legacy MySQL migration compatibility and local runtime

- State: `DONE - PASS`
- Objective: make the T5-091 provider-cost acknowledgement migration inherit the real parent `users.id` collation, prove the historical-schema path with a guarded MySQL regression, apply the already authorized pending migrations to the local runtime database, and restore the backend.
- Dependency: `T5-092 - DONE - PASS` at pushed business delivery `595f1d4bfd5b844014a5b82bcb9045fa541f8291` and closure `2b426a0e303a82f2ce4c0eb7c6863f415dfa135f`.

## Verified incident

- Frontend starts and serves `http://127.0.0.1:5173`.
- Backend can load the Human-authorized repository-local `.env`, but the runtime schema gate correctly blocks startup because the database remains at `e1f2a3b4c5d6` while repository head is `a3b4c5d6e7f8`.
- The authorized `alembic upgrade head` failed at `f2a3b4c5d6e7` with MySQL error 3780. The existing `users.id` is `utf8mb4_unicode_ci`; the migration specifies only `mysql_charset="utf8mb4"`, so MySQL 8 selects its `utf8mb4_0900_ai_ci` default for the new FK column.
- The failed MySQL DDL left the revision at `e1f2a3b4c5d6` and did not leave `provider_cost_acknowledgements`, so the retry boundary is clean.
- Older migrations already implement the required dynamic parent-collation pattern. The current focused migration test did not force a legacy parent/default mismatch and therefore missed the defect.

## Scope

1. Add a guarded regression that forces a legacy `users.id` collation distinct from the server's default and verifies the new FK column inherits it.
2. Apply the established dynamic parent-collation pattern to `f2a3b4c5d6e7_add_provider_cost_acknowledgements.py`.
3. Run focused migration tests and migration-head/static checks.
4. Re-run the Human-authorized local runtime migration from `e1f2a3b4c5d6` to head without exposing `.env` values.
5. Start backend on `127.0.0.1:8000` and verify backend `/health` plus frontend HTTP readiness.
6. Review, document, commit, and push only the owned hotfix paths.

## Non-goals

- No new product/schema capability, data rewrite, downgrade, destructive database operation, paid provider call, or secret output.
- No changes to T5-091/T5-092 runtime behavior beyond migration compatibility.
- No staging of `.env`, `.codex/`, `.hermes/plans/`, `output/`, or unrelated files.

## Acceptance criteria

1. The regression demonstrates that the pre-fix migration fails against a deliberately mismatched legacy parent collation.
2. The fixed migration derives `mysql_collate` from `INFORMATION_SCHEMA.COLUMNS` for `users.id` and remains dialect-safe.
3. The guarded disposable-MySQL migration reaches repository head and `provider_cost_acknowledgements.user_id` exactly matches `users.id` collation.
4. The real local schema reaches `a3b4c5d6e7f8` under the explicit Human authorization already granted in this task.
5. Backend `/health` and frontend root both return HTTP 200; no secret value appears in evidence.
6. Diff, migration-head, sensitive-path, secret, exact-stage, commit, and `origin/main` checks pass.
