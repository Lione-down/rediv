# T5-002 Progress: P0 credential cleanup and complete MySQL-only retirement

Last updated: 2026-07-12

## State

- Task: `T5-002 - P0 credential cleanup and complete MySQL-only retirement`
- State: `DOING`
- Branch at activation: `main`
- Base HEAD at activation: `b84f1b4a48f777623fd5fe280f083bb14f894bc4`
- Pre-existing worktree: 45 untracked root `.playwright-cli/*.yml` files and untracked `output/`
- Pre-existing staged changes: none
- Unmerged paths: none

## Completed Work

- Product and architecture decisions were approved and recorded by T5-001.
- Exact MySQL/SQLite runtime, test, dependency, migration-tool, and documentation surfaces were inventoried.
- Unit A retired `backend/run_alembic_mysql.py` as an unused helper, removing the tracked hard-coded database password assignment without opening the file, printing the value, or rendering its raw diff.
- Active-code reference inspection found no caller for the retired helper.
- Redacted tracked credential scans found no remaining hard-coded password assignment. Seven URL-shaped test/config or historical-evidence fixtures were classified in-process by path, pattern label, and fingerprint only; no candidate value was emitted.
- Backend compile and regression verification passed: `compileall` succeeded and 189 tests passed, including guarded creation and cleanup of the exact-name disposable `revid_test_t4_002` schema.
- Unit A is delivered in a scoped local commit together with its durable state updates.
- Current running health was observed as MySQL connected and ready with Alembic `current == head == e9f1a2b3c4d5`; this is runtime evidence, not proof that source defaults are safe.
- Three ignored `.db` artifact paths were identified without opening them; deletion remains outside scope.

## Remaining Work

- Unit B MySQL-only runtime and health.
- Unit C test and tooling migration.
- Unit D full verification and closure.

## Exact Next Action

Start Unit B by replacing SQLite-selectable runtime configuration with fail-closed MySQL-only settings and focused tests.

## Files Changed

- `backend/run_alembic_mysql.py` (deleted without reading or displaying its content)
- `ai/tasks/doing/TASK-T5-002-PROGRESS.md`
- `ai/state/CURRENT.md`

## Commands And Summarized Results

- `git diff --name-status/--numstat/--summary -- backend/run_alembic_mysql.py`: confirmed one 24-line tracked deletion without rendering deleted content.
- `rg` active-code reference check: no reference to the retired helper under existing backend, frontend, or scripts roots. An initial composite check named a nonexistent root `tests/` directory and stopped before scan/tests; the corrected command used only existing roots.
- redacted tracked credential scans: the P0 password assignment is absent; seven remaining URL-shaped fixtures were classified without candidate output as short test/config literals, username-matching examples, or placeholder-marked historical evidence.
- `backend/.venv/Scripts/python.exe -m compileall -q backend`: PASS.
- `backend/.venv/Scripts/python.exe -m unittest discover -s backend/tests -p "test_*.py"`: PASS, 189 tests in 52.704 seconds; guarded disposable MySQL test schema cleanup succeeded.
- No `.env` or `.db` file was opened, and no user database, paid provider, or secret value was accessed.

## Blockers And Release Conditions

- If the redacted credential was ever real, rotation in the owning system requires Human Owner action; deleting source code does not release that security condition.
- local `.db` cleanup remains blocked pending exact-path Human approval after backup and parity verification.
