# TASK-T5-093 Progress

- Task state: `DOING`
- Active unit: `Unit 1 - Regression and minimal migration fix`

## Completed work

- Reproduced the startup boundary: frontend is HTTP 200 on port 5173; backend loads the explicitly authorized local `.env` but correctly refuses a stale schema.
- Confirmed repository head `a3b4c5d6e7f8`, runtime revision `e1f2a3b4c5d6`, and the two pending migrations.
- Ran the explicitly authorized local `alembic upgrade head`; it failed safely at `f2a3b4c5d6e7` with MySQL 3780 before the acknowledgement table or revision was committed.
- Read-only metadata inspection confirmed `users.id` uses `utf8mb4_unicode_ci`, while MySQL's `default_collation_for_utf8mb4` is `utf8mb4_0900_ai_ci`.
- Identified the exact root cause: the provider acknowledgement migration sets `mysql_charset` but omits the existing dynamic `mysql_collate` inheritance pattern already used by other FK migrations.
- Confirmed the existing focused migration test did not construct the legacy parent/default mismatch.

## Remaining work

- Add and run the failing legacy-collation regression.
- Apply the minimal dynamic parent-collation fix and run focused checks.
- Re-run the authorized local migration, start backend, and verify both services.
- Complete diff/hygiene review, REPORT, exact commit, and push.

## Exact next action

Extend `backend/tests/test_provider_cost_acknowledgement_migration.py` to force the parent/default collation mismatch in its disposable schema, then run it against the existing migration to capture RED evidence.

## Files changed

- `ai/tasks/todo/TASK-T5-093.md`
- `ai/tasks/doing/TASK-T5-093-PLAN.md`
- `ai/tasks/doing/TASK-T5-093-PROGRESS.md`
- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`

## Commands run and summarized results

- Required start audit: only unrelated `.codex/`, `.hermes/plans/`, and `output/` were untracked; `HEAD` was `2b426a0e303a82f2ce4c0eb7c6863f415dfa135f`.
- Backend launch with absolute `--env-file`: startup schema gate reported current `e1f2a3b4c5d6`, expected `a3b4c5d6e7f8`.
- Authorized `python -m dotenv ... alembic upgrade head`: failed at `f2a3b4c5d6e7` with MySQL 3780.
- Read-only schema inspection: runtime revision unchanged; no partial acknowledgement table; parent and server-default collations differ.

## Blockers and release conditions

- Backend remains intentionally blocked until the migration compatibility fix passes and the authorized local schema reaches head.
- No secret, provider, paid-call, or destructive-operation blocker is in scope.
