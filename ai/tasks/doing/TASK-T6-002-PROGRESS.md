# TASK-T6-002 Progress

- State: `DOING`
- Verification outcome: `PENDING`
- Active unit: `Unit 5 - Agnes credential boundary`
- Task: `ai/tasks/todo/TASK-T6-002.md`
- Plan: `ai/tasks/doing/TASK-T6-002-PLAN.md`
- Activation baseline: `HEAD == origin/main == 760d2ef3dcb217b6026e7da345a4702484f370c6`; ahead/behind `0/0`.

## Completed Work

- Read the complete required Source of Truth and linked ADRs, then verified there was no active implementation Task.
- Verified the audit plan exists at `.hermes/plans/2026-07-20_225502-project-audit-remediation.md` with SHA-256 `457ACDEF858F3A5AD54659CC43F63D8E87A70B722B91775B854E970AA7E56C0E`.
- Verified the tracked worktree is clean and `HEAD == origin/main`; preserved all user-owned untracked `.codex/`, `.hermes/plans/`, and `output/` paths.
- Confirmed ADR-002/004/005 keep the existing Vue/FastAPI/MySQL/multi-canvas boundaries and direct delivery requires one active Task.
- Materialized and activated the T6-002 Task/PLAN/PROGRESS chain before any business-code edit.
- Completed Unit 1 with test-driven fail-closed defaults: production profile, loopback bind declaration, explicit mock-auth opt-in, WeChat mock disabled, blank dev-admin key, strong non-placeholder JWT validation, and exact rejection of the former tracked placeholder.
- Moved dev-admin authentication from the query string to `X-Revid-Dev-Admin-Key`; disabled or non-loopback development routes return 404 and configured missing/invalid headers return 403 without credential echo.
- Added request-client loopback enforcement to mock WeChat authorize/login/callback paths while preserving the real WeChat contract.
- Added a MySQL `auth_attempt_windows` fixed-window authority with complete table/column comments, HMAC-SHA256 subjects, `SELECT ... FOR UPDATE`, cross-worker concurrency, success clear, expiry reset, and stable 429/`Retry-After` behavior.
- Bound password login to `IP+identifier`, development admin to IP, and mock issuance to IP so identifier/openid rotation cannot bypass the shared window.
- Updated both tracked examples, backend runtime documentation, loopback startup command, and frontend admin header transport. No real secret, provider request, or user database was accessed.
- Completed Unit 2 with one MySQL transaction owning fresh registration-settings read, duplicate prechecks, locked invitation validation, user/identity/quota/ledger creation, invitation increment, and database uniqueness handling.
- Removed `store.use_invitation_code()` from both password and WeChat API registration flows. Compatibility caches now refresh only from committed rows and never authorize invitation redemption.
- Added stable 403/409 domain-to-HTTP mapping, preserved username/email conflict details, and normalized offset-aware invitation expirations to UTC before MySQL `DATETIME` persistence.
- Added rollback coverage for password quota, WeChat identity, and WeChat quota failures plus a real two-thread/two-connection single-use invitation race. Failed registrations leave user, identity, quota, ledger, and `used_count` unchanged.
- Completed Unit 3 caller classification: no production frontend or supported external caller uses `/assets/from_generation`, `/projects/{project_id}/nodes`, or `/projects/{project_id}/connections`; remaining references were old tests, architecture text, and historical Tasks.
- Removed the client-supplied generated-asset endpoint and request schema. Native generation transactions remain the only authority that can persist `source=generation` lineage.
- Unmounted and removed the two project-scoped graph API modules. Canonical Canvas-scoped document/resource routes remain active, and the end-to-end generation workflow now creates its node through the exact Canvas-scoped path.
- Removed the two obsolete legacy-route CRUD test modules while retaining graph schema/transaction coverage in multi-canvas, Canvas document, and store suites. Added explicit route-absence and forged-provenance zero-mutation coverage.
- Centralized the backend test-suite development mock contract so fail-closed production defaults no longer make unrelated suites depend on cross-test setting leakage. Focused throttle suites explicitly restore the limit of five.
- Completed Unit 4 content-free measurement across 20 deterministic accepted-shape Canvas mutations: P50 `16,089` bytes, P95/max `226,761` bytes, and a measured range of `909..226,761` bytes for 1..200 nodes and up to 300 connections.
- Enforced the authorized `2 MiB` raw request, `64 KiB` node content, `16 KiB` connection metadata, and depth-16 contracts before Pydantic fingerprint/persistence work. Added aggregate caps of 50,000 keys, 75,000 strings, and 1.5 MiB UTF-8 string bytes.
- Added a chunk-aware reader that does not trust `Content-Length`, a raw nesting scan before JSON decode, an iterative non-recursive measurement walker, non-finite number rejection, and schema-level field-budget validation.
- Added exact-boundary, one-byte-over, 1,000-node aggregate, depth-17, aggregate key/string/string-byte, and no-content-length chunked tests. Every rejection proves graph revision, node, connection, and Canvas revision counts are unchanged.

## Remaining Work

- Units 5 through 10 in `TASK-T6-002-PLAN.md` remain to be implemented and verified.
- Unit 4 budget gate is released by the Human Owner's explicit full-plan execution request and the recorded measurement/contract above.
- Unit 3 route removal requires a Human decision only if a live external caller or support commitment is discovered.

## Exact Next Action

Verify the repository-owned Agnes production endpoint contract, then add Unit 5 RED tests for plaintext, userinfo, query/fragment, confusable/suffix, and arbitrary HTTPS endpoints before client construction.

## Files Changed

- `ai/tasks/todo/TASK-T6-002.md`
- `ai/tasks/doing/TASK-T6-002-PLAN.md`
- `ai/tasks/doing/TASK-T6-002-PROGRESS.md`
- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`
- `.env.example`
- `backend/.env.example`
- `backend/README.md`
- `backend/settings/config.py`
- `backend/api/admin.py`
- `backend/api/auth.py`
- `backend/core/auth_throttle.py`
- `backend/models/auth_attempt.py`
- `backend/models/__init__.py`
- `backend/migrations/versions/b4c5d6e7f8a9_add_auth_attempt_windows.py`
- `backend/tests/test_runtime_security_defaults.py`
- `backend/tests/test_auth_throttle.py`
- `backend/tests/test_mysql_runtime_cutover.py`
- `backend/tests/test_password_auth_contract.py`
- `backend/tests/test_wechat_callback.py`
- `backend/tests/test_admin_enhancements.py`
- `frontend/src/api/admin.ts`
- `backend/controllers/registration.py`
- `backend/controllers/store.py`
- `backend/tests/test_registration_concurrency.py`
- `backend/api/assets.py`
- `backend/api/router.py`
- `backend/schemas/asset.py`
- `backend/api/canvas_nodes.py` (removed)
- `backend/api/canvas_connections.py` (removed)
- `backend/tests/test_canvas_node_crud.py` (removed)
- `backend/tests/test_canvas_connection_crud.py` (removed)
- `backend/tests/__init__.py`
- `backend/tests/test_asset_upload.py`
- `backend/tests/test_project_asset_services.py`
- `backend/tests/test_multi_canvas_foundation.py`
- `backend/tests/test_e2e_workflow.py`
- `ai/architecture/REVID-V2-CANVAS-ARCHITECTURE.md`
- `backend/core/json_budget.py`
- `backend/api/canvas_documents.py`
- `backend/schemas/canvas_document.py`
- `backend/tests/test_canvas_document_limits.py`

## Commands Run And Results

- Required start Git audit: tracked clean; only preserved untracked user paths; `HEAD 760d2ef3`; `HEAD == origin/main`; ahead/behind `0/0`.
- Source hashes: CURRENT `56870B...`; ROADMAP `395DB9...`; audit plan `457ACD...` before Task activation.
- Unit 1 Settings RED: `4` tests produced `8` expected errors for missing profile/opt-in/bind fields and one-argument security validation; GREEN is `5/5` after exact placeholder and request-loopback coverage.
- Dev-admin transport RED: query returned `200`, header returned `422`, and disabled header returned `422`; GREEN focused is `4/4` with query rejected, header accepted, disabled hidden, and missing bootstrap fail closed.
- Throttle core RED: `3/3` failed because no persistence authority existed; GREEN is `3/3`, including six concurrent attempts with exactly five allowed and one limited.
- API throttle RED: sixth password/dev-admin/mock attempts remained `401/403/200`; GREEN is `4/4`, and a second RED proved openid rotation bypass before the IP-level mock bucket fix.
- Final Unit 1 backend matrix: `54/54` passed in `141.742s` against guarded disposable `revid_test_*` schemas.
- Related frontend production build: `4947 modules transformed`; Python affected-file compile passed; Alembic reports single head `b4c5d6e7f8a9`.
- Unit 2 RED: the new suite initially failed because no transactional registration service existed; the first GREEN attempt then exposed child-row flush ordering, and related regression exposed offset-aware expiry drift through MySQL `DATETIME`.
- Unit 2 concurrency/rollback suite: `5/5` passed in each of three consecutive guarded disposable-MySQL runs (`27.518s`, `27.555s`, `28.036s`), with exactly one winner and `used_count=1` every time.
- Unit 2 related regression: combined invitation/password auth ran `25` tests with only the newly exposed expiry case failing; after UTC normalization the focused expiry case passed and the full invitation suite passed `7/7`. The other `24` tests in the combined run passed.
- Unit 3 RED: the project-scoped node route still returned `200` before unmounting. The initial forged-provenance run exposed a pre-existing test-runtime dependency on leaked mock settings before reaching the assertion; the centralized explicit test contract released that setup blocker.
- Unit 3 GREEN: forged arbitrary/failed/foreign task payloads issue no asset mutation and the three route-absence checks pass `3/3`; asset/project suites pass `24/24`; multi-canvas/E2E/native generation transaction, concurrency, and restart suites pass `27/27`.
- Unit 3 adjacent security regression passes `7/7`; the deterministic Canvas document persistence Chromium spec passes `2/2`. No real provider call or user database was used.
- Unit 4 RED failed at import because no JSON budget authority existed. GREEN is `7/7`, including exact raw/field boundaries, +1-byte failures, aggregate budgets, depth, and chunked no-content-length transport with zero database mutation.
- Unit 4 related Canvas document/revision/fingerprint/generation-idempotency regression is `19/19`; deterministic Canvas document persistence Chromium remains `2/2` after the manual bounded reader replaced framework body parsing.

## Blockers And Release Conditions

- Current blocker: none for Unit 5; no real Agnes request or credential access is authorized or required.
- Unit 4 limit gate: record non-content size distribution and obtain exact Human-approved budgets before enforcing the product contract.
- Human gates remain real/paid provider calls, real secrets, destructive/user database work, irreversible migrations, external-account changes, and incompatible supported-route removal.
