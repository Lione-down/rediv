# Revid Current Project State

Last updated: 2026-07-13

## Delivery Mode

- Mode: `CODEX_DIRECT_DELIVERY`
- Engineering owner: Codex Project Lead Engineer
- Human Owner gates: product direction, paid calls, real secrets, destructive or irreversible operations
- Hermes: retired; no Queue, card, profile, Reviewer, HANDOFF, or runtime reconciliation is active
- Delivery decision: `ai/decisions/ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md`

## Product State

- Phase 4 initial version: `COMPLETE - PASS`
- Product V2 / Phase 5: active
- V2 priority: Canvas first acceptance
- Visual direction: premium graphite-black and dark-purple system
- Database direction: MySQL-only; runtime is cut over and the first four persistence-test slices are migrated, while remaining legacy SQLite tests/tooling stay isolated until T5-002 Unit C/B2 completes

## Active Delivery

- Task: `T5-002 - P0 credential cleanup and complete MySQL-only retirement`
- State: `DOING`
- Task: `ai/tasks/todo/TASK-T5-002.md`
- Plan: `ai/tasks/doing/TASK-T5-002-PLAN.md`
- Progress: `ai/tasks/doing/TASK-T5-002-PROGRESS.md`
- Dependency: T5-001 complete

## Latest Completed Task

- Task: `T5-001 - V2 documentation and architecture baseline`
- State: `DONE - PASS`
- Task: `ai/tasks/todo/TASK-T5-001.md`
- Plan: `ai/tasks/doing/TASK-T5-001-PLAN.md`
- Progress: `ai/tasks/doing/TASK-T5-001-PROGRESS.md`
- Report: `ai/reports/REPORT-T5-001.md`
- Outcome: V2 product, Canvas acceptance, visual, architecture, MySQL-only, multi-canvas, roadmap, and execution contracts are decision-complete.

## Locked V2 Documents

- PRD: `ai/requirements/REVID-V2-PRD.md`
- Canvas acceptance: `ai/requirements/REVID-V2-CANVAS-ACCEPTANCE.md`
- Canvas architecture: `ai/architecture/REVID-V2-CANVAS-ARCHITECTURE.md`
- V2 design system: `ui/REVID-V2-DESIGN-SYSTEM.md`
- MySQL-only ADR: `ai/decisions/ADR-004-mysql-only-runtime-and-tests.md`
- Multi-canvas ADR: `ai/decisions/ADR-005-project-multi-canvas.md`
- Roadmap: `ai/state/ROADMAP.md`

## Current Facts And Risks

- Current running health was last observed as MySQL connected and ready with `current == head == e9f1a2b3c4d5`.
- Runtime source selection is MySQL-only and fail closed; remaining SQLite code is confined to legacy test/tooling helpers owned by Unit C/B2.
- T5-002 Unit A retired the unused `backend/run_alembic_mysql.py` helper and removed its tracked hard-coded database password assignment without opening the file or displaying the value/raw diff; the verified unit is delivered in a scoped local commit.
- Source cleanup does not rotate a credential that may have been used. Rotation remains a separate Human Owner gate if the assignment was ever real or reused.
- Unit A verification passed backend compile and all 189 backend tests; redacted scans found no remaining hard-coded password assignment.
- Human-requested Unit A.1 removed 24 tracked one-off diagnostics, status-repair scripts, and retired Hermes PowerShell entrypoints with no active product caller; `Agents.md` is normalized to `AGENTS.md`.
- Root Playwright/runtime evidence and pytest cache now have durable narrow ignore rules; two zero-byte generated artifacts were removed from the tracked tree but retained locally as ignored evidence.
- Unit B1 removed runtime SQLite selection, requires process-supplied MySQL host/name/user/password, and initializes MySQL only through the FastAPI lifespan.
- Startup, health, Alembic, admin seed, and store initialization now fail closed on missing configuration, wrong dialect, connection failure, missing schema, or revision mismatch; no production in-memory fallback remains.
- Unit B1 focused tests passed, Alembic reports the single expected head, and the full backend regression passed 190 tests with pre-Alembic identity verification and guarded disposable `revid_test_t4_002` cleanup.
- Unit C added a reusable process-credential-only MySQL test fixture with exact ASCII `revid_test_*` names, post-create and pre-cleanup `SELECT DATABASE()` identity gates, Alembic head setup, and process-setting restoration.
- `test_database_store.py` is the first converted persistence slice; its eight tests run on disposable `revid_test_database_store`, focused tests passed 12/12, backend regression passed 194/194, and both test schemas were cleaned.
- `test_project_crud.py` is the second converted slice; its database-backed cases run on disposable `revid_test_project_crud`, its explicit in-memory case remains a pure unit test, focused tests passed 12/12, backend regression passed 194/194, and the schema was cleaned.
- `test_canvas_node_crud.py` is the third converted slice; its database-backed cases run on disposable `revid_test_canvas_node_crud`, its explicit in-memory case remains a pure unit test, focused tests passed 13/13, backend regression passed 194/194, and the schema was cleaned.
- `test_canvas_connection_crud.py` is the fourth converted slice; its database-backed cases run on disposable `revid_test_canvas_connection_crud`, its explicit in-memory case remains a pure unit test, and actual MySQL table/column comments plus the edge unique constraint are asserted.
- The first full regression exposed an equal-timestamp tie in the preceding project-list test; its assertion now verifies exact membership and descending timestamps without assuming ID order inside a tie. Focused verification passed 15/15, final backend regression passed 194/194, and both affected disposable schemas were cleaned.
- Legacy SQLite engine/schema helpers, SQLite-backed database tests, dependency/tooling, and active documentation remain owned by Unit C/B2 and are not runtime-selectable.
- Deep review re-confirmed pre-existing placeholder JWT and dev-admin defaults; they remain an implementation security-closure item, not a Human gate, and were not mixed into Unit B1.
- Current Canvas remains project-scoped, uses conflicting light and dark theme sources, hides its grid behind an opaque surface, and broadly rebuilds the Leafer scene.

## Exact Next Action

Migrate `backend/tests/test_asset_upload.py` to a dedicated guarded MySQL schema through the reusable fixture, preserving its isolated upload-file lifecycle while removing only the SQLite database fallback.

## Blockers And Release Conditions

- Credential rotation becomes Human-required only if the assignment was ever real or reused; release by rotating it in the owning system and recording only the outcome.
- Local ignored `.db` artifact deletion is blocked pending exact-path Human approval after MySQL backup and parity evidence.
- No push is authorized.

## Worktree Protection

- Unit A run started from `main` at `a245dcb31065f209217095707e4067c5b0243066`.
- Pre-existing staged, tracked-modified, unmerged, detached, and in-progress Git-operation state: none.
- Root `.playwright-cli/`, `output/runtime/`, and local runtime evidence are ignored and excluded from delivery staging.
- Ignored `.env` and `.db` artifacts must not be opened, deleted, moved, or committed without explicit authorization.

## Delivery Automation

- Automation: `revid-codex-direct-delivery-controller`
- Commit policy: each completed verified unit ends in a scoped local commit; no automatic push
- Automation memory is only a cursor and never overrides this file, ROADMAP, Tasks, code, tests, or runtime evidence.
- Project conversation archive: `ai/state/archive/PROJECT-CONVERSATION-ARCHIVE-THROUGH-2026-07-13.md`
