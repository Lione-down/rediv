# Revid Project Conversation Archive

- Archived through: 2026-07-13
- Repository history: 70 commits from 2026-06-17 through 2026-07-13
- Evidence surface: canonical Tasks plus 155 reports, 230 reviews, 7 ADRs, state documents, automation records, and Git history
- Live state at archive: `T5-002 / DOING`
- HEAD at archive start: `359a0cd32e95f0cb00e801ed785f9421cddd6afb`

This document summarizes all project conversations that were persisted into the repository. It is a historical navigation aid, not a replacement for live state. Current facts remain in `ai/state/CURRENT.md`, `ai/state/ROADMAP.md`, and the active Task PLAN/PROGRESS.

The Codex app available in this run exposed archive-by-thread-ID but no thread-list or thread-read capability. Therefore, repository-persisted conversations are comprehensively summarized here, while UI-only conversations without repository evidence could not be enumerated or individually archived.

## Durable Resume Order

1. `AGENTS.md`
2. `ai/state/CURRENT.md`
3. `ai/state/ROADMAP.md`
4. CURRENT's exact active Task
5. CURRENT's active PLAN and PROGRESS
6. ADRs and specifications explicitly linked by those documents
7. source, tests, runtime evidence, and Git diff
8. this archive and older reports/reviews only when historical context is needed

Automation memory is only a cursor. Retired Hermes Queue, card, profile, Reviewer, and HANDOFF files are historical evidence and must not be resumed.

## Project Evolution

### Phase 1 — Backend product foundation

The first project conversations established persistence and the core backend product model:

- T1-001: backend database persistence;
- T1-002: backend ignore rules and README;
- T1-003: invitation-controlled registration;
- T1-004: quota ledger and quota E2E coverage;
- T1-005: asset upload and listing;
- T1-006: project CRUD;
- T1-007: Canvas node CRUD;
- T1-008: backend template system;
- T1-009: Admin project management, user details, and operation logs.

Canonical evidence is in `ai/tasks/done/` and `ai/reports/REPORT-T1-*.md`.

### Phase 2 — Frontend foundation and responsive shell

The next conversations moved the prototype into Vue and connected primary product surfaces:

- frontend initialization and prototype migration;
- Workspace, Space, and Admin layout migrations;
- login-to-profile/assets/quota integration;
- desktop and 375px responsive verification;
- shared SCSS design-token extraction.

Canonical evidence is in `ai/tasks/done/TASK-T2-*.md` and `ai/reports/REPORT-T2-*.md`.

### Phase 3 — Canvas interactions, provider flows, and OAuth

Phase 3 delivered the first interactive creative workflow:

- Leafer UI Canvas integration;
- node rendering, selection, drag, connection, pan, zoom, and minimap;
- Agnes text, image, and video flows with task status, error, and quota feedback;
- WeChat OAuth frontend and backend paths while retaining the then-required mock compatibility;
- multimodal and image/video E2E verification.

Canonical evidence is in `ai/tasks/done/TASK-T3-*.md` and `ai/reports/REPORT-T3-*.md`.

### Phase 4 — MySQL, authentication, real-data UI, Canvas persistence, and release closure

Phase 4 converted the prototype into a verified first product version:

- MySQL 8 models, comments, Alembic baseline, migration tooling, runtime cutover, and disposable test schemas;
- password authentication, Admin bootstrap, login/registration UI, and route/session guards;
- dark design system and Naive UI provider;
- real-data Home and Space experiences with guarded pagination, detail, mutation, media, and deletion flows;
- Canvas connection persistence, optimistic graph mutation, component decomposition, multi-selection, and context actions;
- process-key-gated Agnes real smoke;
- authenticated browser workflow, responsive visual matrix, security closure, and final Phase 4 acceptance.

Phase 4 ended `COMPLETE - PASS` at commit `b84f1b4 docs(phase4): close final acceptance`. The final report is `ai/reports/REPORT-T4-013.md`, with overall closure in `ai/reviews/REVIEW-PHASE4-COMPLETE.md`.

#### Retired Hermes governance history

The very large T4-002 and T4-010 revision chains record repeated Queue, runtime, reviewer, finalization, evidence, and state-reconciliation failures. They produced useful safety rules but excessive coordination overhead. On 2026-07-10, `ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md` replaced Hermes multi-agent delivery with one Codex Project Lead Engineer.

All `ai/automation/` Hermes contracts, revision Tasks, diagnostic reports, reviews, HANDOFFs, and `ai/state/archive/CURRENT-HERMES-THROUGH-2026-07-10.md` are historical only. Do not recreate or reconcile their runtime state.

### Phase 5 / Product V2 — Active

T5-001 established the V2 PRD, Canvas acceptance contract, architecture, design system, MySQL-only ADR, multi-canvas ADR, and delivery roadmap. It completed at `a245dcb docs(v2): establish product and canvas baseline`.

T5-002 is active and retires credentials, SQLite runtime/test/tooling paths, and production fallbacks while keeping the repository usable after every bounded unit.

Delivered T5-002 units:

- `725a2f7 security(backend): retire credential migration helper` — removed the tracked hard-coded password assignment without disclosing its value;
- `05d1876 chore(repo): remove obsolete tooling artifacts` — removed obsolete diagnostics and retired Hermes entrypoints, normalized `AGENTS.md`, and tightened ignore rules;
- `e4014a5 feat(backend): enforce mysql-only runtime gates` — made startup, health, Alembic, seed, and store initialization MySQL-only and fail closed;
- `ee3d445 test(backend): add guarded mysql fixture` — added reusable `MySQLTestDatabase` and migrated `test_database_store.py`;
- `359a0cd test(backend): migrate project crud to mysql` — migrated `test_project_crud.py` while preserving its pure `InMemoryStore` unit case.

The last three commits were local-only at archive start. No push was authorized.

## Locked Product And Architecture Decisions

- Vue 3, TypeScript, Pinia, Naive UI, Leafer UI, SCSS, FastAPI, SQLAlchemy, MySQL, and Alembic remain the selected stack.
- MySQL 8 is the only runtime and database-backed test engine. SQLite and production in-memory fallbacks are retirement targets, not rollback paths.
- A project owns multiple canvases. Graph, viewport, edit history, undo/redo, and revision state are canvas-scoped; assets and generation history are project-scoped.
- V2 Canvas is desktop-first, mobile review-only, single-user first, and must support the 200-node/300-connection acceptance target.
- Leafer UI remains the only Canvas engine. Page-level global redesign starts only after Canvas first acceptance.
- Runtime and test credentials are process supplied. Credential-bearing URLs must not be rendered into evidence.
- Every new or changed database table and column requires a non-empty comment.

## Accumulated Engineering Lessons

- Repository documents, source, tests, runtime evidence, and Git state outrank conversation memory and automation cursors.
- One active implementation Task and one bounded unit per run materially reduce state drift.
- Before business code, keep PLAN and PROGRESS current; after implementation, run focused verification, relevant regression, fresh diff review, durable state updates, and a scoped local commit.
- Never infer ownership from a dirty path. Preserve unknown staged, modified, untracked, ignored, and generated work.
- MySQL test schemas must use exact ASCII `revid_test_*` names and verify `SELECT DATABASE()` before destructive cleanup. Never target `revid_db` or another non-test schema.
- A class-scoped MySQL schema persists across test methods. Tests migrated from per-method SQLite files need unique identities or another non-destructive isolation strategy; fixed OpenIDs caused cross-test row accumulation.
- Run Alembic commands from `backend/` because its config contains a relative script location.
- Full regression still contains legacy migration-tool failure-path tests that print expected diagnostics before the suite reports `OK`; the unittest result and exit code remain the verdict.
- Browser QA artifacts belong only in ignored evidence directories and must not be staged.
- Source credential removal does not perform rotation. Rotation remains an external Human Owner action if the value was ever real or reused.
- Real Agnes smoke is paid/external and requires action-time authorization even when a process key exists.
- Long append-only state diaries become misleading. CURRENT must remain a concise rolling snapshot; historical detail belongs in archives.

## Current Verified State

- Active Task: `T5-002 - P0 credential cleanup and complete MySQL-only retirement`.
- Runtime selection is MySQL-only and fails closed on missing configuration, wrong dialect, connection failure, missing schema, or Alembic mismatch.
- FastAPI configures `DatabaseStore` only after successful MySQL startup and revision checks; no production `InMemoryStore` fallback remains.
- Alembic has one head: `e9f1a2b3c4d5`.
- `MySQLTestDatabase` requires process-supplied `REVID_TEST_MYSQL_ADMIN_URL`, guards schema identity, applies Alembic head, restores process settings, and cleans up its exact schema.
- `test_database_store.py` and `test_project_crud.py` have migrated to dedicated guarded MySQL schemas and contain no SQLite/temp-file/init-db path.
- Latest backend full regression passed 194 tests in 42.650 seconds. Focused tests, compile, schema cleanup probes, `git diff --check`, and redacted staged credential scanning passed.
- Worktree was clean before this archive request. Ignored local `.env`, database, browser/runtime evidence, dependency, and build artifacts remained untouched.

## Remaining Work And Human Gates

- Migrate all remaining SQLite-backed database tests to guarded MySQL schemas.
- Remove legacy SQLite engine/schema helpers, `aiosqlite`, migration tooling, wrappers, test configs, and active SQLite documentation.
- Complete T5-002 Unit D regression, restart persistence, schema comments/FKs, security, README, REPORT, ROADMAP, and state closure.
- Remove or explicitly production-gate placeholder JWT and dev-admin defaults before release.
- Credential rotation is Human-required only if the removed assignment was real or reused.
- Ignored local `.db` deletion requires exact-path Human approval after backup and parity evidence.
- Paid Agnes calls, destructive user/production database actions, irreversible migrations, and push remain unauthorized without explicit approval.

## Exact Resume Action

Migrate `backend/tests/test_canvas_node_crud.py` to a dedicated exact-name guarded MySQL schema through `MySQLTestDatabase`, without SQLite fallback. Do not start T5-003 or another Task.
