# T4-004 Direct Delivery Progress

Last updated: 2026-07-10

State: `DONE`

## Completed

- T4-003 dependency completed with `ai/reports/REPORT-T4-003-DIRECT.md`.
- Created the T4-004 direct-delivery PLAN and PROGRESS entry points.
- Preserved the original T4-004 scope and added the direct Codex owner.
- Audited the active Auth implementation, persistence layer, settings, migration baseline, frontend WeChat callback contract, and current Auth/admin tests.
- Added focused T4-004 contract tests in `backend/tests/test_password_auth_contract.py` for password register/login, public registration settings, legacy WeChat nullable username/email payloads, and env-driven Admin bootstrap.
- Implemented the additive password-auth contract across backend Auth, security, store, and model layers:
  - nullable `username`, `email`, and `password_hash` on users;
  - non-leaking user serialization plus password lookup helpers;
  - password policy, bcrypt hashing, and password verification;
  - `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, and public `GET /auth/registration-settings`;
  - preserved WeChat login response shape while exposing nullable `username` / `email`;
  - banned users are rejected during Auth issuance while frozen users still authenticate.
- Added env-driven `backend/scripts/seed_admin.py` plus store-level `ensure_admin_user(...)` idempotent bootstrap behavior.
- Added Alembic revision `b7d4c2e9f001_add_password_auth_columns_to_users.py` for the expanded `users` schema.
- Added SQLite runtime compatibility in `backend/database.py` so legacy local SQLite files are upgraded to the new Auth columns before `DatabaseStore()` reads them.
- Installed `bcrypt` into `backend/.venv` for repository verification.
- Removed the remaining implicit default-admin fallback from store initialization so runtime no longer auto-creates a passwordless Admin.
- Changed `DatabaseStore()` to bootstrap Admin only when both `REVID_ADMIN_USERNAME` and `REVID_ADMIN_PASSWORD` are present, while preserving the upgrade path for legacy Admin rows.
- Hardened `/admin/dev-login` to fail closed unless a password-backed bootstrapped Admin exists.
- Updated the affected admin/quota/invitation/store/asset/runtime tests so they seed an Admin explicitly instead of relying on implicit store bootstrap.
- Replaced the retained real WeChat OAuth `requests` flow with `httpx`.
- Added backend-signed WeChat OAuth `state` issuance and callback validation using the existing signed-token primitives, while keeping the flow stateless.
- Updated the frontend WeChat login flow to persist the backend-issued signed `state` token and fail closed on callback mismatch before posting to `/auth/wechat/callback`.
- Added focused WeChat callback coverage for signed `state` issuance, missing/tampered callback rejection, and real-mode `httpx` request mocking.
- Refreshed the broader migration/runtime compatibility layer for T4-004:
  - fixed stale settings-singleton test contamination by keeping health/MySQL runtime tests on the shared in-process `settings` object instead of reloading `settings.config`;
  - changed MySQL URL construction to read live settings so Alembic/migration tooling honors runtime env overrides instead of falling back to default `root@localhost`;
  - updated migration-tool user conflict fixtures for the expanded `users` schema and taught same-PK comparison to ignore target-only nullable password-auth columns.
- Re-ran the full backend unittest discover suite plus a fresh disposable SQLite `alembic upgrade head` smoke after the migration/runtime compatibility fixes.
- Committed the direct-delivery governance and Hermes-retirement backlog separately so the remaining delivery diff is scoped to T4-003 closeout evidence plus T4-004 implementation/verification.
- Reviewed the additive MySQL migration `b7d4c2e9f001`, applied it to shared MySQL `revid_db`, and verified the schema reached Alembic head.
- Wrote `ai/reports/REPORT-T4-004.md`, marked T4-004 `DONE`, and selected T4-011 as the next dependency-ready active Task.

## Remaining

- None for T4-004. T4-011 is the next active Task.

## Exact Next Action

Proceed with T4-011 by auditing existing project/canvas-node backend files and tests before adding connection contract tests.

## Files Changed

- `backend/api/auth.py`
- `backend/api/admin.py`
- `backend/controllers/store.py`
- `backend/core/security.py`
- `backend/database.py`
- `backend/models/base.py`
- `backend/migrations/env.py`
- `backend/migrations/versions/b7d4c2e9f001_add_password_auth_columns_to_users.py`
- `backend/models/user.py`
- `backend/requirements.txt`
- `backend/schemas/auth.py`
- `backend/scripts/migrate_sqlite_to_mysql.py`
- `backend/scripts/seed_admin.py`
- `backend/settings/config.py`
- `backend/tests/test_admin_enhancements.py`
- `backend/tests/test_asset_upload.py`
- `backend/tests/test_database_store.py`
- `backend/tests/test_invitation_code.py`
- `backend/tests/test_migration_tool.py`
- `backend/tests/test_mysql_runtime_cutover.py`
- `backend/tests/test_password_auth_contract.py`
- `backend/tests/test_quota_flow.py`
- `backend/tests/test_wechat_callback.py`
- `frontend/src/api/auth.ts`
- `frontend/src/store/auth.ts`
- `frontend/src/views/app/WechatCallback.vue`
- `ai/tasks/doing/TASK-T4-004-PROGRESS.md`
- `ai/state/CURRENT.md`
- `ai/reports/REPORT-T4-004.md`
- `ai/state/ROADMAP.md`
- `ai/tasks/todo/TASK-T4-004.md`
- `ai/tasks/todo/TASK-T4-011.md`
- `ai/tasks/doing/TASK-T4-011-PLAN.md`
- `ai/tasks/doing/TASK-T4-011-PROGRESS.md`

## Commands And Summarized Results

- `git status --short` / `git diff --stat` / `git diff --name-only`: reconfirmed the dirty worktree is dominated by pre-existing Hermes retirement and T4-003/direct-delivery changes; preserved unrelated files.
- `git rev-parse HEAD`: base commit remains `6cd2fb58f92f17c03f1eda1ab0feeae255d49f42`.
- `backend/.venv\Scripts\python.exe -m pip install bcrypt`: installed `bcrypt 5.0.0` into the repository virtualenv for password hashing verification.
- `backend/.venv\Scripts\python.exe -m compileall .`: passed.
- `backend/.venv\Scripts\python.exe -m unittest discover -s tests -p "test_*auth*.py"`: 8 tests passed.
- `backend/.venv\Scripts\python.exe -m unittest tests.test_database_store tests.test_invitation_code tests.test_wechat_callback tests.test_admin_enhancements tests.test_quota_flow`: 32 tests passed.
- `backend/.venv\Scripts\python.exe -m unittest tests.test_mysql_runtime_cutover`: 9 tests passed.
- `backend/.venv\Scripts\python.exe -m unittest tests.test_health`: 5 tests passed.
- `backend/.venv\Scripts\python.exe -m alembic -c backend/alembic.ini upgrade head` against a disposable SQLite DB: passed; baseline plus `b7d4c2e9f001` applied cleanly.
- `backend/.venv\Scripts\python.exe -m unittest tests.test_password_auth_contract tests.test_admin_enhancements tests.test_quota_flow tests.test_invitation_code tests.test_database_store tests.test_asset_upload tests.test_mysql_runtime_cutover`: 61 tests passed; verified env-only runtime Admin bootstrap, fail-closed `dev-login`, and explicit Admin test seeding across the impacted regression slice.
- `backend/.venv\Scripts\python.exe -m unittest tests.test_health`: 5 tests passed after the runtime Admin bootstrap hardening.
- `backend/.venv\Scripts\python.exe -m compileall .`: passed after the runtime Admin bootstrap hardening.
- `backend/.venv\Scripts\python.exe -m unittest tests.test_wechat_callback tests.test_password_auth_contract tests.test_invitation_code`: 25 tests passed; verified backend-signed WeChat `state`, missing/tampered callback rejection, legacy WeChat account contract, invitation gating, and `httpx`-based real-mode callback mocks.
- `backend/.venv\Scripts\python.exe -m compileall .`: passed after the WeChat OAuth hardening.
- `npm run build` in `frontend/`: passed; confirmed the frontend stores the backend-issued signed WeChat `state` and the callback page compiles with the stricter mismatch check.
- `backend/.venv\Scripts\python.exe -m unittest tests.test_password_auth_contract tests.test_health tests.test_mysql_runtime_cutover tests.test_migration_tool`: 51 tests passed after fixing the live-settings/Alembic regression path and the migration-tool `users` compatibility fixtures.
- `backend/.venv\Scripts\python.exe -m unittest discover -s tests -p "test_*.py"`: 172 tests passed; the wider backend regression slice is now green.
- `backend/.venv\Scripts\python.exe -m compileall .`: passed after the wider regression slice.
- `backend/.venv\Scripts\python.exe -m alembic upgrade head` against a fresh disposable SQLite DB: passed again after the wider regression slice; baseline plus `b7d4c2e9f001` applied cleanly.
- `git diff --check`: passed; only existing LF->CRLF warnings were emitted by Git.
- `backend/.venv\Scripts\python.exe -m compileall .`: passed again during backlog reconciliation.
- `backend/.venv\Scripts\python.exe -m unittest discover -s tests -p "test_*.py"`: 172 tests passed again during backlog reconciliation.
- `npm run build` in `frontend/`: passed again during backlog reconciliation.
- `backend/.venv\Scripts\python.exe -m alembic -c alembic.ini upgrade head` against a fresh disposable SQLite DB with `REVID_USE_SQLITE=true`: passed again during backlog reconciliation.
- `git commit -m "docs(governance): adopt codex direct delivery"`: committed the governance-only backlog separately before the remaining business-phase reconciliation.
- Shared MySQL preflight: `revid_db` on MySQL 8.0.43 was at `a1b2c3d4e5f6` with no T4-004 auth columns or auth indexes.
- Shared MySQL migration review: `b7d4c2e9f001` is additive for nullable `username`, `email`, `password_hash`, comments, and unique indexes; no data rewrite, drop, truncate, delete, downgrade, or reset was required.
- Shared MySQL `alembic upgrade head`: passed; `revid_db` reached `b7d4c2e9f001`.
- Shared MySQL post-check: auth columns are nullable with comments, `ix_users_username` and `ix_users_email` are unique, and non-null non-bcrypt `password_hash` count is `0`.
- Runtime MySQL health/Auth smoke: `/health` returned `status=ok`, `dialect=mysql`, `connected=true`, `ready=true`, `alembic_match=true`; `/auth/registration-settings` returned only `registration_mode,wechat_login_enabled`; invalid login returned `401`.
- `backend/.venv\Scripts\python.exe -m compileall .`: passed during final closeout.
- `backend/.venv\Scripts\python.exe -m unittest discover -s tests -p "test_*.py"`: 172 tests passed during final closeout.
- `npm run build` in `frontend/`: passed during final closeout.
- `git diff --check`: passed during final closeout; only LF-to-CRLF warnings were emitted.
- Staged path and credential-pattern checks: staged paths were limited to T4-004/T4-011 documentation; no sensitive path or credential-like assignment was detected.

## Verification

- Focused Auth contract evidence is now green for password register/login, registration settings exposure, banned/frozen semantics, WeChat nullable account fields, and env-driven Admin bootstrap.
- The latest targeted regression slice confirmed that admin dashboards/logging/quota flows, invitation-code behavior, store persistence, asset Admin actions, MySQL write-order safety, and health checks no longer depend on implicit default-admin creation.
- The focused WeChat/Auth slice now confirms `/auth/wechat/authorize` issues backend-signed state tokens, `/auth/wechat/callback` rejects missing or tampered state, and retained real-mode profile exchange now uses `httpx`.
- Frontend production build is green after switching the callback flow to persist and compare the backend-issued WeChat state token.
- The widened backend regression suite is now green at `172` passing tests, including the refreshed migration/runtime fixtures and the real-MySQL-backed migration tool coverage.
- Disposable SQLite Alembic upgrade behavior is freshly green after the widened regression rerun.
- Shared MySQL is now at the T4-004 head revision and runtime health/Auth smoke is green.

## Blockers

- No T4-004 implementation blocker remains.
- Real WeChat credentials remain a Human Owner gate for end-to-end OAuth verification; this is recorded in `REPORT-T4-004.md` and is not claimed as completed.
