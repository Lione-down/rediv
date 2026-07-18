# TASK-T5-093 Progress

- Task state: `DONE - PASS`
- Active unit: none

## Completed work

- Reproduced the startup boundary: frontend is HTTP 200 on port 5173; backend loads the explicitly authorized local `.env` but correctly refuses a stale schema.
- Confirmed repository head `a3b4c5d6e7f8`, runtime revision `e1f2a3b4c5d6`, and the two pending migrations.
- Ran the explicitly authorized local `alembic upgrade head`; it failed safely at `f2a3b4c5d6e7` with MySQL 3780 before the acknowledgement table or revision was committed.
- Read-only metadata inspection confirmed `users.id` uses `utf8mb4_unicode_ci`, while MySQL's `default_collation_for_utf8mb4` is `utf8mb4_0900_ai_ci`.
- Identified the exact root cause: the provider acknowledgement migration sets `mysql_charset` but omits the existing dynamic `mysql_collate` inheritance pattern already used by other FK migrations.
- Confirmed the existing focused migration test did not construct the legacy parent/default mismatch.
- Added a deterministic disposable-MySQL legacy-collation fixture. It drops only disposable inbound `users.id` foreign keys, converts `users` to a collation distinct from the server default, and verifies exact parent/child collation equality after upgrade.
- Captured RED evidence: the unchanged migration failed the new fixture with the same MySQL 3780 fingerprint.
- Added the established dialect-safe parent-collation lookup to `f2a3b4c5d6e7`; the focused migration test then reached `a3b4c5d6e7f8` and passed.
- Applied the explicitly authorized local upgrade from `e1f2a3b4c5d6` to `a3b4c5d6e7f8`. Runtime metadata confirms both `users.id` and `provider_cost_acknowledgements.user_id` use `utf8mb4_unicode_ci`.
- Started backend with the absolute local env-file path. Backend `/health` and frontend root both return HTTP 200 on ports 8000 and 5173.
- Business hotfix `b23b6cb9d4354cc37a78b13352e95774a81f2b07` was committed after exact staging and sensitive-path/secret-signature checks.

## Remaining work

- None for T5-093.

## Exact next action

Await Human Owner selection of the next bounded implementation Task. Keep the currently running frontend/backend available until the Human Owner stops them or the processes exit.

## Files changed

- `ai/tasks/todo/TASK-T5-093.md`
- `ai/tasks/doing/TASK-T5-093-PLAN.md`
- `ai/tasks/doing/TASK-T5-093-PROGRESS.md`
- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`
- `ai/reports/REPORT-T5-093.md`
- `backend/migrations/versions/f2a3b4c5d6e7_add_provider_cost_acknowledgements.py`
- `backend/tests/test_provider_cost_acknowledgement_migration.py`

## Commands run and summarized results

- Required start audit: only unrelated `.codex/`, `.hermes/plans/`, and `output/` were untracked; `HEAD` was `2b426a0e303a82f2ce4c0eb7c6863f415dfa135f`.
- Backend launch with absolute `--env-file`: startup schema gate reported current `e1f2a3b4c5d6`, expected `a3b4c5d6e7f8`.
- Authorized `python -m dotenv ... alembic upgrade head`: failed at `f2a3b4c5d6e7` with MySQL 3780.
- Read-only schema inspection: runtime revision unchanged; no partial acknowledgement table; parent and server-default collations differ.
- RED focused migration test: failed with MySQL 3780 at `f2a3b4c5d6e7` against the forced legacy collation.
- GREEN focused migration test: `1 test`, pass; disposable schema reached `a3b4c5d6e7f8` and exact parent/child collation equality passed.
- Related migration/runtime matrix: `13 tests`, pass.
- `py_compile`: migration and focused test passed; `alembic heads`: one head, `a3b4c5d6e7f8`.
- Authorized local `alembic upgrade head`: passed from `e1f2a3b4c5d6` to `a3b4c5d6e7f8`.
- Runtime schema metadata: acknowledgement `user_id` and parent `users.id` both `utf8mb4_unicode_ci`.
- HTTP readiness: backend `/health` 200 on port 8000; frontend root 200 on port 5173.
- `git diff --check`, UTF-8/no-BOM, staged sensitive-path, staged secret-signature, exact-stage, and HEAD-drift checks passed for business commit `b23b6cb`.

## Blockers and release conditions

- No T5-093 blocker remains.
- No secret was printed or staged; no provider/paid call or destructive database operation occurred.
