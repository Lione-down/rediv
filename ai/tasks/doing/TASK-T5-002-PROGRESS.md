# T5-002 Progress: P0 credential cleanup and complete MySQL-only retirement

Last updated: 2026-07-13

## State

- Task: `T5-002 - P0 credential cleanup and complete MySQL-only retirement`
- State: `DOING`
- Branch at activation: `main`
- Base HEAD at activation: `b84f1b4a48f777623fd5fe280f083bb14f894bc4`
- Pre-existing worktree: 45 untracked root `.playwright-cli/*.yml` files and untracked `output/`
- Pre-existing staged changes: none
- Unmerged paths: none

## Completed Work

- Human Owner granted project-scoped standing authorization for scheduled delivery to commit and push completed, verified scoped units to `origin`; the controller and durable project policy now retain the safety boundaries for secrets, paid calls, external accounts, local `.db` artifacts, non-test databases, and operations outside this repository.
- Product and architecture decisions were approved and recorded by T5-001.
- Exact MySQL/SQLite runtime, test, dependency, migration-tool, and documentation surfaces were inventoried.
- Unit A retired `backend/run_alembic_mysql.py` as an unused helper, removing the tracked hard-coded database password assignment without opening the file, printing the value, or rendering its raw diff.
- Active-code reference inspection found no caller for the retired helper.
- Redacted tracked credential scans found no remaining hard-coded password assignment. Seven URL-shaped test/config or historical-evidence fixtures were classified in-process by path, pattern label, and fingerprint only; no candidate value was emitted.
- Backend compile and regression verification passed: `compileall` succeeded and 189 tests passed, including guarded creation and cleanup of the exact-name disposable `revid_test_t4_002` schema.
- Unit A is delivered in a scoped local commit together with its durable state updates.
- Human-requested Unit A.1 removed 24 tracked one-off diagnostics, status-repair scripts, and retired Hermes PowerShell entrypoints after confirming they had no active product caller.
- Unit A.1 normalized `Agents.md` to `AGENTS.md`, added narrow ignore rules for root Playwright/runtime evidence and pytest cache, and removed two zero-byte generated artifacts from the tracked tree while retaining their ignored local copies.
- Historical documents, `.hermes` evidence, MySQL/SQLite migration and test surfaces owned by Units B/C, local databases, `.env`, current runtime logs, and frontend orphan candidates were preserved.
- Current running health was observed as MySQL connected and ready with Alembic `current == head == e9f1a2b3c4d5`; this is runtime evidence, not proof that source defaults are safe.
- Three ignored `.db` artifact paths were identified without opening them; deletion remains outside scope.
- Unit B1 removed runtime `use_sqlite` / `db_path` selection and `.env` file loading, made DB host/name/user/password process configuration mandatory, and kept credential-bearing URLs as SQLAlchemy `URL` objects rather than rendered strings.
- FastAPI now initializes only MySQL through its lifespan, validates the Alembic revision before configuring `DatabaseStore`, and closes the engine on normal shutdown or startup-gate failure.
- Runtime revision and health gates reject non-MySQL engines; `/health` is ready only after a successful MySQL connection with `current == head` and does not return connection error details.
- The global store proxy now starts unconfigured and raises until MySQL startup completes, removing the production `InMemoryStore` fallback while preserving explicit fake injection for tests.
- Admin seed and the standard Alembic environment are MySQL-only and fail closed on missing schema or revision drift.
- Focused SQLite health/runtime/seed tests were replaced with pure-mock MySQL configuration, lifecycle, health, revision, and store-initialization contracts.
- The existing migration fixture was minimally reconciled to drive the MySQL-only Alembic environment without restoring retired settings; its guarded `revid_test_t4_002` schema was created, verified, and dropped by the full regression.
- Deep security/architecture review found and fixed SQLAlchemy `URL` pool-recycle detection and added a pre-Alembic exact-name plus `SELECT DATABASE()` identity gate; seed test semantics now distinguish subprocess env validation from pure-mock ordering/idempotence.
- Unit C now has a reusable test-only `MySQLTestDatabase` lifecycle that accepts only process-supplied `REVID_TEST_MYSQL_ADMIN_URL`, requires an ASCII exact-name `revid_test_*` schema, uses SQLAlchemy structured URLs, applies Alembic head, and verifies `SELECT DATABASE()` after creation and before cleanup.
- `test_database_store.py` is the first migrated persistence slice: its eight tests now run against the dedicated disposable `revid_test_database_store` schema with no SQLite path, and the fixture restores process settings after class cleanup.
- `test_project_crud.py` now runs its database-backed API and persistence cases against dedicated disposable `revid_test_project_crud`; per-test identities are unique within the class-scoped schema, while the explicit `InMemoryStore` case remains a pure database-free unit test.
- `test_canvas_node_crud.py` now runs its database-backed API and persistence cases against dedicated disposable `revid_test_canvas_node_crud`; per-test identities isolate the class-scoped schema, while the explicit `InMemoryStore` case remains a pure database-free unit test.
- `test_canvas_connection_crud.py` now runs its database-backed API, persistence, cascade, and schema/comment cases against dedicated disposable `revid_test_canvas_connection_crud`; per-test identities isolate the class-scoped schema, while the explicit `InMemoryStore` case remains a pure database-free unit test.
- The migrated project-list test now accepts equal MySQL `created_at` timestamps while still asserting the exact result membership and descending timestamp contract, removing a deterministic tie-order regression without changing production behavior.
- `test_asset_upload.py` now runs all asset API and persistence cases against dedicated disposable `revid_test_asset_upload`; per-test OpenIDs isolate the class-scoped schema, while each multipart upload retains its isolated per-test filesystem lifecycle.
- `test_e2e_workflow.py` now runs its mocked Agnes full-workflow persistence case against dedicated disposable `revid_test_e2e_workflow`, preserving project, node, generated-asset, quota deduction, and provider-call assertions without a SQLite fallback.
- `test_image_e2e.py` now runs its five mocked image-provider workflow cases against dedicated disposable `revid_test_image_e2e`, preserving asset persistence, quota deduction/refund, source-image forwarding, provider-failure, and empty-quota assertions without a SQLite fallback.
- `test_video_e2e.py` now runs its five mocked video-provider workflow cases against dedicated disposable `revid_test_video_e2e`, preserving polling, asset persistence, quota deduction/refund, provider-failure, timeout, and empty-quota assertions without a SQLite fallback.
- Unit C completion batch migrated the remaining 64 database-backed API, auth, Admin, quota, template, WeChat, text, image, and video tests to ten guarded per-test MySQL schemas. `addCleanup()` guarantees schema cleanup even when later setup steps fail.
- Unit C retired `aiosqlite`, the SQLite-to-MySQL migration implementation and its 29 discovered tool-only tests, two root migration probes, two tracked test probes, the legacy Alembic test config, and two non-standard Alembic wrappers after confirming no active caller.
- Active README, `.env.example`, `alembic.ini`, wrong-dialect tests, and dependency declarations now describe or exercise MySQL-only behavior without the retired selectors or rendered placeholder database URL.
- Equal-timestamp project and template list assertions now verify exact membership and descending timestamps without assuming undefined ID order inside a MySQL timestamp tie.
- Unit B2 removed the final SQLite engine, schema-bootstrap, URL-builder, and runtime `create_all()` helpers. `init_engine()` is now a no-argument MySQL-only API, and the retired helpers are no longer exported from `models`; the earlier concurrent HEAD drift was reconciled and the scoped delivery commit preserves the Human Owner policy changes.

## Remaining Work

- Unit D security and full verification closure, including removal or explicit production gating of the pre-existing placeholder JWT secret and default dev-admin key.

## Exact Next Action

Start Unit D by refreshing its PLAN/PROGRESS scope, then remove or explicitly production-gate the placeholder JWT secret and default dev-admin key with focused configuration/auth tests before the remaining full-closure checks.

## Latest Completed Bounded Unit

- Implemented and verified Unit B2 by deleting the final unreferenced SQLite engine/schema helpers from the three planned backend modules while preserving the MySQL lifecycle, session, revision, and cleanup APIs.
- Compile and focused runtime/fixture/database-store verification passed 21/21; backend regression passed 165/165; Alembic retained one head; the disposable test schemas were cleaned; active backend SQLite and tracked database-artifact scans returned zero matches.
- The pre-existing `revid_test_db` schema and ignored local `.db` artifacts remain untouched. The later stable-baseline verification passed and Unit B2 is delivered in the scoped commit containing this progress update.

## Files Changed

- Delivery authorization policy: `ai/automation/REVID-CODEX-DIRECT-OPERATING-MODEL.md`, `ai/state/CURRENT.md`, `ai/state/ROADMAP.md`, `pitfalls.md`, and this progress document.
- `backend/run_alembic_mysql.py` (deleted without reading or displaying its content)
- `ai/tasks/doing/TASK-T5-002-PROGRESS.md`
- `ai/state/CURRENT.md`
- Unit A.1 repository hygiene: `.gitignore`, `Agents.md` -> `AGENTS.md`, 12 root one-off files, 4 `ai/reports/*.py` repair/probe files, 4 backend debug/smoke files, and 4 retired `scripts/*.ps1` Hermes entrypoints.
- Unit A.1 generated tracking cleanup: `.playwright-cli/page-2026-07-11T15-29-19-414Z.yml` and `ai/evidence/runtime/reviewer-finalization-smoke/kanban.db.init.lock` removed from the tracked tree and retained locally under ignore rules.
- `ai/tasks/doing/TASK-T5-002-PLAN.md` and this progress document updated for the bounded hygiene prerequisite.
- Unit B1 runtime: `backend/settings/config.py`, `backend/models/base.py`, `backend/database.py`, `backend/main.py`, `backend/api/health.py`, `backend/controllers/store.py`, `backend/migrations/env.py`, and `backend/scripts/seed_admin.py`.
- Unit B1 compatibility and tests: `backend/scripts/migrate_sqlite_to_mysql.py`, `backend/tests/test_health.py`, `backend/tests/test_migration_tool.py`, `backend/tests/test_mysql_runtime_cutover.py`, and `backend/tests/test_password_auth_contract.py`.
- Durable state: `ai/tasks/doing/TASK-T5-002-PLAN.md`, this progress document, and `ai/state/CURRENT.md`.
- Unit C first slice: `backend/tests/mysql_test_database.py`, `backend/tests/test_mysql_test_database.py`, and `backend/tests/test_database_store.py`.
- Unit C project CRUD slice: `backend/tests/test_project_crud.py`.
- Unit C Canvas node CRUD slice: `backend/tests/test_canvas_node_crud.py`.
- Unit C Canvas connection CRUD slice: `backend/tests/test_canvas_connection_crud.py`.
- Unit C regression stabilization: `backend/tests/test_project_crud.py`.
- Unit C asset upload slice: `backend/tests/test_asset_upload.py`.
- Unit C full-workflow E2E slice: `backend/tests/test_e2e_workflow.py`.
- Unit C image E2E slice: `backend/tests/test_image_e2e.py`.
- Unit C video E2E slice: `backend/tests/test_video_e2e.py`.
- Unit C completion tests: `backend/tests/test_admin_enhancements.py`, `backend/tests/test_image_generate.py`, `backend/tests/test_invitation_code.py`, `backend/tests/test_password_auth_contract.py`, `backend/tests/test_quota_flow.py`, `backend/tests/test_template_system.py`, `backend/tests/test_text_generate.py`, `backend/tests/test_video_generate.py`, and `backend/tests/test_wechat_callback.py`.
- Unit C dependency/config/docs: `backend/requirements.txt`, `backend/.env.example`, `backend/alembic.ini`, `backend/README.md`, and root `README.md`; wrong-dialect coverage updated in `backend/tests/test_health.py` and `backend/tests/test_mysql_runtime_cutover.py`.
- Unit C retired tooling: `backend/scripts/migrate_sqlite_to_mysql.py`, `backend/tests/test_migration_tool.py`, `backend/test_infrastructure.py`, `backend/test_migration_flow.py`, `backend/tests/_alembic_check.py`, `backend/tests/_quick_check.py`, `backend/alembic_test.ini`, `backend/alembic_wrapper.py`, and `backend/run_alembic.py`.
- Unit B2 runtime retirement: `backend/database.py`, `backend/models/base.py`, and `backend/models/__init__.py`.
- Project conversation archive: `ai/state/archive/PROJECT-CONVERSATION-ARCHIVE-THROUGH-2026-07-13.md`.

## Commands And Summarized Results

- Automation configuration update: PASS; `revid-codex-direct-delivery-controller` remains active and now authorizes verified scoped commit/push work only within `D:\works\codexWorks\project_revid`.
- `git diff --name-status/--numstat/--summary -- backend/run_alembic_mysql.py`: confirmed one 24-line tracked deletion without rendering deleted content.
- `rg` active-code reference check: no reference to the retired helper under existing backend, frontend, or scripts roots. An initial composite check named a nonexistent root `tests/` directory and stopped before scan/tests; the corrected command used only existing roots.
- redacted tracked credential scans: the P0 password assignment is absent; seven remaining URL-shaped fixtures were classified without candidate output as short test/config literals, username-matching examples, or placeholder-marked historical evidence.
- `backend/.venv/Scripts/python.exe -m compileall -q backend`: PASS.
- `backend/.venv/Scripts/python.exe -m unittest discover -s backend/tests -p "test_*.py"`: PASS, 189 tests in 52.704 seconds; guarded disposable MySQL test schema cleanup succeeded.
- No `.env` or `.db` file was opened, and no user database, paid provider, or secret value was accessed.
- Unit A.1 active-reference check: PASS; none of the 24 deleted tooling files had an active product caller.
- `backend/.venv/Scripts/python.exe -m compileall -q backend`: PASS after hygiene cleanup.
- `backend/.venv/Scripts/python.exe -m unittest discover -s backend/tests -p "test_*.py"`: PASS after hygiene cleanup, 189 tests in 51.645 seconds; guarded disposable schema cleanup succeeded.
- `npm --prefix frontend run build`: PASS; TypeScript/Vite production build transformed 4702 modules.
- strict UTF-8, exact ignore-rule probes, generated-tracked check, and `git diff --check`: PASS.
- `backend/.venv/Scripts/python.exe -m compileall -q backend`: PASS for Unit B1.
- focused runtime/health/seed/schema-guard tests: PASS, 19 tests; only pure mocks plus a missing-password subprocess contract, with no real database connection in this focused set.
- `backend/.venv/Scripts/python.exe -m alembic -c alembic.ini heads` from `backend/`: PASS, single head `e9f1a2b3c4d5`. The first root-cwd attempt failed before migration because `script_location` is relative; rerunning from the documented backend cwd resolved the command-only issue.
- first backend regression after the cutover reached 174 tests with one migration-fixture error and one dependent seed failure because legacy tooling still wrote the removed field; the MySQL-only compatibility correction removed those stale writes without restoring SQLite selection.
- final `backend/.venv/Scripts/python.exe -m unittest discover -s tests -p "test_*.py"`: PASS, 190 tests in 41.586 seconds; guarded disposable `revid_test_t4_002` creation, pre-Alembic identity assertion, migration, and cleanup paths ran and the schema was dropped.
- active runtime selector scans: PASS; no `REVID_USE_SQLITE`, `REVID_DB_PATH`, `settings.use_sqlite`, `settings.db_path`, Alembic SQLite selector, or SQLite-ready health branch remains in the runtime surface.
- deep read-only security/architecture review: two in-scope findings fixed; pre-existing predictable JWT/dev-admin defaults recorded for later security closure without expanding this bounded unit's auth contract.
- `python -m compileall` plus focused fixture/store tests: PASS, 12 tests; four pure guard tests and eight disposable-MySQL persistence tests.
- backend full regression: PASS, 194 tests in 45.263 seconds; existing migration coverage used and cleaned `revid_test_t4_002`, while the new store slice used and cleaned `revid_test_database_store`.
- fixture cleanup probe: PASS; `revid_test_database_store` did not exist after the focused and full runs. Alembic remained at the single head `e9f1a2b3c4d5`, and the migrated store test contained zero SQLite/temp-file/init-db references.
- initial focused project CRUD migration run reached all 12 selected tests and exposed one isolation failure: a class-scoped schema reused fixed OpenIDs, so `test_list_projects` observed four accumulated rows instead of two; identities were then made unique per test without destructive per-test cleanup.
- final `tests.test_mysql_test_database tests.test_project_crud` focused run: PASS, 12 tests in 1.821 seconds; four pure guard tests and eight project CRUD tests used guarded MySQL where persistence was required.
- `python -m compileall -q .` and backend full regression: PASS, 194 tests in 42.650 seconds; disposable `revid_test_t4_002`, `revid_test_database_store`, and `revid_test_project_crud` paths completed without a suite failure.
- project CRUD cleanup probe: PASS; `revid_test_project_crud` did not exist after verification. Alembic remained at the single head `e9f1a2b3c4d5`, the migrated file contained zero SQLite/temp-file/init-db references, and `git diff --check` passed.
- `tests.test_mysql_test_database tests.test_canvas_node_crud` focused run: PASS, 13 tests in 1.874 seconds; four pure guard tests and nine Canvas node CRUD tests used guarded MySQL where persistence was required.
- `python -m compileall -q .` and backend full regression: PASS, 194 tests in 43.510 seconds; all disposable schemas completed without a suite failure.
- Canvas node cleanup probe: PASS; `revid_test_canvas_node_crud` did not exist after verification. Alembic remained at the single head `e9f1a2b3c4d5`, the migrated file contained zero SQLite/temp-file/init-db references, and `git diff --check` passed.
- `tests.test_mysql_test_database tests.test_canvas_connection_crud` focused run: PASS, 14 tests in 2.081 seconds; four pure guard tests and ten Canvas connection CRUD/schema tests used guarded MySQL where persistence was required.
- The first backend regression reached all 194 tests with one failure in `test_project_crud.test_list_projects`: two MySQL rows shared the same `created_at`, so the prior strict ID order assertion was not defined. A focused reproduction failed consistently; the assertion now verifies exact membership and descending timestamps without assuming order inside a tie.
- Focused project-order plus fixture/Canvas connection rerun: PASS, 15 tests in 3.296 seconds.
- `python -m compileall -q .` and final backend full regression: PASS, 194 tests in 42.771 seconds.
- Cleanup probes: PASS; `revid_test_canvas_connection_crud` and `revid_test_project_crud` did not exist after verification. Alembic remained at the single head `e9f1a2b3c4d5`, the migrated connection test contained zero SQLite/temp-file/init-db references, and `git diff --check` passed.
- `tests.test_mysql_test_database tests.test_asset_upload` focused run: PASS, 17 tests in 4.592 seconds; four pure fixture guard tests and 13 asset API/persistence tests used guarded MySQL where persistence was required, while multipart files used per-test temporary storage.
- `python -m compileall -q .` and backend full regression: PASS, 194 tests in 41.118 seconds. Alembic remained at the single head `e9f1a2b3c4d5`.
- Asset cleanup probe: PASS; `revid_test_asset_upload` did not exist after verification. The migrated file contained zero SQLite database/init/close references, remaining legacy test slices were inventoried for the next unit, and `git diff --check` passed.
- `tests.test_mysql_test_database tests.test_e2e_workflow` focused run: PASS, 5 tests in 1.261 seconds; four pure fixture guard tests and one mocked-provider full-workflow test used guarded MySQL for persistence.
- `python -m compileall -q .` and backend full regression: PASS, 194 tests in 41.722 seconds. Alembic remained at the single head `e9f1a2b3c4d5`.
- E2E cleanup probe: PASS; `revid_test_e2e_workflow` did not exist after verification. The migrated file contained zero SQLite/temp-file/init/close references, `git diff --check` passed, and fresh review confirmed no production, schema, provider, or assertion changes.
- `tests.test_mysql_test_database tests.test_image_e2e` focused run: PASS, 9 tests in 1.525 seconds; four pure fixture guard tests and five mocked image-provider workflow tests used guarded MySQL for persistence.
- `python -m compileall -q .` and backend full regression: PASS, 194 tests in 43.815 seconds. Alembic remained at the single head `e9f1a2b3c4d5`.
- Image E2E cleanup probe: PASS; `revid_test_image_e2e` did not exist after verification. The migrated file contained zero SQLite/temp-file/init/close references, `git diff --check` passed, and fresh review confirmed no production, schema, provider, or assertion changes.
- Redacted staged-addition credential scan: PASS with zero candidates. The first scanner attempt was rejected because it scanned the whole index and used hashing APIs unavailable in the local PowerShell runtime; the corrected scanner inspected only staged added lines and emitted no candidate content.
- `tests.test_mysql_test_database tests.test_video_e2e` focused run: PASS, 9 tests in 1.473 seconds; four pure fixture guard tests and five mocked video-provider workflow tests used guarded MySQL for persistence.
- `python -m compileall -q .` and backend full regression: PASS, 194 tests in 43.109 seconds. Alembic remained at the single head `e9f1a2b3c4d5`.
- Video E2E cleanup probe: PASS; `revid_test_video_e2e` did not exist after verification. The migrated file contained zero SQLite/temp-file/init/close references, `git diff --check` passed, and fresh review confirmed no production, schema, provider, or assertion changes.
- Unit C focused completion run reached 68 selected tests with one undefined MySQL project tie-order assertion; after the exact-membership correction, the affected Admin module passed 7/7. A later full regression exposed the equivalent template tie-order assumption; the focused template module passed 9/9 after correction.
- Final `python -m unittest discover -s tests -p "test_*.py"`: PASS, 165 tests in 101.410 seconds. The count is 29 lower than the prior 194 because exactly 29 discovered tests belonged to the retired migration tool, not active product behavior.
- `python -m compileall -q .`, `python -m alembic -c alembic.ini heads`, and `git diff --check`: PASS; Alembic has the single head `e9f1a2b3c4d5`.
- Unit C static and caller scans: PASS; migrated tests/config/requirements/active README contain no retired database markers, and no active caller references the deleted tooling paths. Historical decisions and archived evidence were preserved.
- Unit C cleanup probe: PASS; none of the ten schemas created by this batch remained. A pre-existing `revid_test_db` schema was observed but not created, selected, written, or dropped because starting ownership was not established.
- Unit B2 `python -m compileall -q .` plus `tests.test_mysql_runtime_cutover tests.test_mysql_test_database tests.test_database_store`: PASS, 21 tests in 3.673 seconds; pure runtime guards and a disposable-MySQL persistence slice exercised the no-argument engine API and safe cleanup.
- Unit B2 `python -m unittest discover -s tests -p "test_*.py"`: PASS, 165 tests in 120.535 seconds.
- Unit B2 Alembic/static/cleanup checks: single head `e9f1a2b3c4d5`; no active backend SQLite helper/selector marker and no tracked database artifact; only the pre-existing `revid_test_db` schema remained after verification and was not touched; `git diff --check` passed.
- Stable-baseline Unit B2 re-verification: `python -m compileall -q .` plus the focused runtime/fixture/database-store suite passed 21/21 in 3.014 seconds; Alembic retained the single head `e9f1a2b3c4d5`; active retirement, tracked database-artifact, HEAD-stability, and `git diff --check` gates passed.

## Blockers And Release Conditions

- If the redacted credential was ever real, rotation in the owning system requires Human Owner action; deleting source code does not release that security condition.
- local `.db` cleanup remains blocked pending exact-path Human approval after backup and parity verification.
- The pre-existing `revid_test_db` schema requires ownership confirmation before any destructive cleanup; this run left it untouched and it does not block Unit B2 source work.
