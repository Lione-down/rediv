# Revid - Current Project State

Last updated: 2026-07-10

## Delivery Mode

- Mode: `CODEX_DIRECT_DELIVERY`
- Engineering owner: Codex Project Lead Engineer
- Human Owner gates: product direction, paid calls, real secrets, destructive or irreversible operations
- Hermes status: retired; no Queue, card, profile, Reviewer, or HANDOFF work is active
- Decision: `ai/decisions/ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md`

## Delivery Automation

- Active: `revid-codex-direct-delivery-controller`
- Cadence: hourly at minute 00 local time
- Model: `gpt-5.4`, xhigh reasoning
- Commit policy: every completed and verified bounded unit or Task phase ends in a scoped local commit; no empty, WIP, mixed-owner, sensitive, or automatic push commits
- Former `revid-codex-pmc-advisor`: `PAUSED`

## Active Task

- Task: `T4-004 - Password authentication and Admin bootstrap`
- State: `VERIFYING`
- Task file: `ai/tasks/todo/TASK-T4-004.md`
- Plan: `ai/tasks/doing/TASK-T4-004-PLAN.md`
- Progress: `ai/tasks/doing/TASK-T4-004-PROGRESS.md`
- Target report: `ai/reports/REPORT-T4-004.md`

## Latest Completed Task

- T4-003: `DONE - PASS`
- Report: `ai/reports/REPORT-T4-003-DIRECT.md`
- MySQL: `revid_db` on 8.0.43
- Alembic current/head at T4-003 close: `a1b2c3d4e5f6` / `a1b2c3d4e5f6`
- Health: `mysql`, connected, ready, revision match
- Safe regression: 144 tests passed
- Real uvicorn, API create-read, engine restart, process restart, SQLite rollback, fail-closed connection error, schema comments, and record visibility all passed

## T4-004 Objective

Add username/email password authentication, registration-mode enforcement, and an idempotent environment-driven Admin bootstrap while preserving existing WeChat identities and login behavior.

## Completed In Current Task

- T4-003 dependency closed.
- Direct T4-004 PLAN and PROGRESS created.
- T4-004 assigned to Codex Project Lead Engineer.
- Completed the required T4-004 source/contract audit across Auth routes, security helpers, user persistence, settings, baseline migration, frontend WeChat callback contract, and current backend tests.
- Added focused backend contract tests in `backend/tests/test_password_auth_contract.py`.
- Implemented the password Auth surface:
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/logout`
  - public `GET /auth/registration-settings`
- Expanded the backend user contract with nullable `username`, `email`, and `password_hash`, while keeping `password_hash` out of API/store payloads.
- Added bcrypt-based password policy, hashing, and verification helpers.
- Added env-driven idempotent `backend/scripts/seed_admin.py`.
- Added Alembic revision `b7d4c2e9f001` for the expanded `users` schema.
- Added SQLite runtime compatibility so legacy local SQLite files are upgraded before `DatabaseStore()` reads them.
- Removed the remaining implicit default-admin fallback: runtime no longer auto-creates a passwordless Admin, `DatabaseStore()` bootstraps only from complete Admin env credentials, and `/admin/dev-login` now fails closed unless a password-backed bootstrapped Admin exists.
- Updated the affected admin/quota/invitation/store/asset/runtime regressions to seed an Admin explicitly, then re-ran the focused backend verification slice.
- Replaced the retained real WeChat OAuth implementation from `requests` to `httpx`.
- Added backend-signed WeChat OAuth `state` issuance on `/auth/wechat/authorize` and callback validation on `/auth/wechat/callback`.
- Updated the frontend WeChat callback contract to persist the backend-issued signed `state` token and reject mismatches before posting back to the backend.
- Refreshed the broader migration/runtime compatibility layer for T4-004 by fixing live-settings MySQL URL resolution, removing stale `settings.config` reloads from the health/runtime tests, and updating the migration tool to tolerate target-only nullable password-auth columns during same-PK comparison.
- Re-ran the full backend unittest discover suite plus a fresh disposable SQLite Alembic smoke after the migration/runtime compatibility fixes.
- Reconfirmed the full backend suite, frontend production build, compileall checks, and disposable SQLite Alembic smoke while reconciling the uncommitted backlog into scoped direct-delivery commits.

## T4-004 Current State

- Password Auth is now implemented for username/email login and registration-mode-aware registration.
- Legacy WeChat accounts still return `token/user/quotas` and now expose nullable `username` / `email` without leaking `password_hash`.
- The repository now uses env-driven Admin bootstrap for both the script path and runtime `DatabaseStore()` initialization; legacy passwordless default-admin fallback is removed.
- Retained real WeChat OAuth now uses `httpx` and a backend-validated signed `state` token that is threaded through the frontend callback flow.
- The wider backend regression surface is green again after updating the migration/runtime fixtures for the expanded `users` schema and eliminating the stale settings-singleton test contamination.
- The Alembic head is now `b7d4c2e9f001`; MySQL runtime should remain fail-closed until that head is reviewed and applied under an authorized migration window.
- End-to-end real WeChat OAuth remains externally unverified until Human Owner credentials/authorization are available.
- The Hermes-retirement/direct-delivery governance backlog is already committed; the remaining Task work is the shared-MySQL migration/review gate plus final report closure.

## T4-004 Verification Snapshot

- `backend/.venv\Scripts\python.exe -m unittest tests.test_password_auth_contract tests.test_admin_enhancements tests.test_quota_flow tests.test_invitation_code tests.test_database_store tests.test_asset_upload tests.test_mysql_runtime_cutover`: 61 passed.
- `backend/.venv\Scripts\python.exe -m unittest tests.test_health`: 5 passed.
- `backend/.venv\Scripts\python.exe -m unittest tests.test_wechat_callback tests.test_password_auth_contract tests.test_invitation_code`: 25 passed.
- `backend/.venv\Scripts\python.exe -m unittest tests.test_password_auth_contract tests.test_health tests.test_mysql_runtime_cutover tests.test_migration_tool`: 51 passed.
- `backend/.venv\Scripts\python.exe -m unittest discover -s tests -p "test_*.py"`: 172 passed.
- `backend/.venv\Scripts\python.exe -m compileall .`: passed.
- `npm run build` in `frontend/`: passed.
- Disposable SQLite `alembic upgrade head`: passed through baseline + `b7d4c2e9f001`.
- `git diff --check`: passed; only existing LF->CRLF warnings were emitted.

## Remaining In Current Task

1. Review/apply the new Alembic head in a safe MySQL window and rerun the post-migration health/Auth acceptance slice against shared runtime evidence.
2. Write `REPORT-T4-004.md`, perform the final diff review, and update ROADMAP/Task state once the shared-MySQL migration evidence is complete.

## Exact Next Action

Review `b7d4c2e9f001` against shared MySQL, apply `alembic upgrade head` in the safe runtime window, and rerun the post-migration health/Auth acceptance slice before drafting `REPORT-T4-004.md`.

## Current Blockers

- No implementation blocker for the next bounded unit.
- Real WeChat credentials remain a Human Owner gate for end-to-end OAuth verification.
- Applying the new Alembic head to shared MySQL remains a runtime gate; no shared database was modified in this run.

## Worktree Protection

- The Hermes retirement/direct-delivery governance backlog has been committed separately.
- Preserve unrelated modified and untracked files in future runs; do not reset, clean, or rewrite historical evidence.

## Historical Evidence

- Former CURRENT timeline: `ai/state/archive/CURRENT-HERMES-THROUGH-2026-07-10.md`
- Former T4-003 Hermes contracts: `ai/tasks/archive/TASK-T4-003-HERMES-THROUGH-REV47R2.md`
- Frozen Hermes operating files: `ai/automation/archive/hermes-retired-2026-07-10/`
