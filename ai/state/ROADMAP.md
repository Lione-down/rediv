# Revid Product V2 / Phase 5 Direct Delivery Roadmap

Last updated: 2026-07-13

## Product Outcome

Deliver a MySQL-only, premium dark-purple Revid V2 whose first accepted milestone is a multi-canvas infinite creative workspace. Global UI upgrades follow only after Canvas acceptance.

## Execution Policy

- One active implementation Task at a time.
- Every Task is independently mergeable and leaves the repository usable.
- Every verified unit ends in a scoped commit and an `origin` push after staged secret hygiene and diff review; no WIP or empty commit/push.
- MySQL user data, local `.db` files, paid Agnes calls, real secrets, destructive operations, and irreversible migrations remain Human Owner gates.
- Mock, disposable MySQL, retained runtime, real service, browser, performance, accessibility, and manual evidence are classified separately.

## Locked Decisions

- `ADR-004`: MySQL 8 is the only runtime and database-backed test engine; no SQLite or production in-memory fallback.
- `ADR-005`: projects own multiple canvases; graph and edit history are canvas-scoped, assets and generation data are project-scoped.
- `ADR-002`: retain Vue 3, TypeScript, Pinia, Naive UI, Leafer UI, SCSS, FastAPI, SQLAlchemy, MySQL, and Alembic.
- V2 Canvas is desktop-first, mobile browse/review only, single-user first, and tested at 200 nodes plus 300 connections.

## Delivery Order

| Order | Task | Deliverable | State | Dependency |
|---:|---|---|---|---|
| 1 | T5-001 | V2 PRD, Canvas acceptance, design system, architecture, ADRs, and roadmap | DONE - PASS | Phase 4 complete and Human direction approved |
| 2 | T5-002 | P0 credential cleanup and complete MySQL-only runtime/test/tooling retirement | DONE - PASS | T5-001 |
| 3 | T5-003 | Multi-canvas MySQL schema, safe backfill, APIs, duplication, and compatibility route | DONE - PASS | T5-002 |
| 4 | T5-004 | Single V2 token source, full-screen Canvas shell, canvas navigation, and viewport persistence | DONE - PASS | T5-003 |
| 5 | T5-005 | Incremental Leafer renderer, command model, selection, multi-move, group, connect, shortcuts, and arrange | DONE - PASS | T5-004 |
| 6 | T5-006 | Autosave queue, optimistic conflict handling, 100-step undo/redo, revisions, checkpoints, and restore | DONE - PASS | T5-005 |
| 7 | T5-007 | Node registry, project-shared assets/templates, generation tasks/results, and mock provider flows | DOING | T5-006 |
| 8 | T5-008 | Canvas first-acceptance E2E, 200/300 performance, browser, visual, accessibility, MySQL, and security closure | TODO | T5-007 |
| 9 | T5-009 | Global V2 app-shell and shared-component dark-purple rollout without Canvas regression | TODO | T5-008 |
| 10 | T5-010 | Login, Home, Space, Admin, error, empty, loading, and responsive V2 UX upgrade | TODO | T5-009 |
| 11 | T5-011 | Full V2 regression, real-runtime verification, security review, documentation, and release closure | TODO | T5-010 |

## Task Boundaries

### T5-002

The Task stays active across independently verified units so runtime and database-backed tests do not become temporarily unusable. Unit A removes the credential literal. Units B and C cut runtime and tests to MySQL-only. Unit D closes full regression and documentation.

### T5-003

Schema rollout is expand-first. Existing projects receive one first canvas, node and connection IDs remain unchanged, and a first-canvas compatibility path keeps the application usable until T5-004 switches the frontend route.

Units A-D are complete. The expand-first migration, atomic default Canvas, database scope constraints, legacy compatibility, authenticated Canvas metadata APIs, optimistic exact-permutation ordering, last-active protection, and transactional duplication with complete graph ID remapping passed guarded MySQL evidence. Final closure passed 44 focused tests, 186 full backend tests plus 5 subtests, a single Alembic head, cleanup, diff, and hygiene gates; `REPORT-T5-003.md` is authoritative evidence.

### T5-004 through T5-008

These Tasks form the Canvas milestone. Shared V2 tokens may land in T5-004, but page-level visual redesign is prohibited until T5-008 passes.

T5-004 is `DONE - PASS`. Units A-E delivered a Canvas-scoped token source, strict metadata store and routing, dedicated full-screen V2 shell, Canvas navigation, contextual generation compatibility, mobile review-only enforcement, one exact Canvas document boundary, explicit graph mutations, independent debounced viewport persistence, and browser-verified language, focus, contrast, target, reduced-motion, responsive, and regression closure. `REPORT-T5-004.md` is authoritative evidence.

T5-005 is `DONE - PASS`. Units A-E deliver one persistent keyed Leafer world, requestAnimationFrame pointer coalescing, world-space SVG edges, 15 FPS minimap sampling, deterministic typed selection/edit/group/connect/arrange/lock commands, Canvas-focus shortcuts, synchronized DOM graph access, 10%-800% view controls, and focused accessibility/performance closure. Final evidence passed Unit E 3/3, full Chromium 36/36, guarded backend 190/190, a 4731-module build, and the four required viewports. The mock-browser 200/300 profile recorded 330 ms stable render, 60.03 FPS, 16.8 ms frame p95, 4.2 ms pointer p95, no observed interaction long task, and 11.93 minimap updates/s. `REPORT-T5-005.md` is authoritative; final local-MySQL 200/300 milestone certification remains T5-008 scope.

T5-006 is `DONE - PASS`. Units A-E delivered one atomic idempotent document PATCH, serialized autosave and exact local recovery, Canvas-keyed 100-command undo/redo, reconstructable latest-50 history, periodic/restore checkpoints, non-destructive restore-to-new-head, explicit conflict recovery, and guarded restart evidence through the production FastAPI lifespan. Final closure passed 12 guarded MySQL document/revision tests, 16 focused Chromium tests, 200 full backend tests, 56 full Chromium tests, a 4,739-module build, accessibility coverage, independent review, and hygiene gates. `REPORT-T5-006.md` is authoritative.

T5-007 is `DOING`. Units A and B are `PASS`: canonical/legacy/unknown node behavior is registry-driven, and Alembic head `a6b7c8d9e0f1` now provides guarded resource origin attribution, versioned template graph backfill, project/Canvas constraints, transactional node-link clearing, and controlled project-resource deletion conflicts. Unit C, project asset/template services and atomic target-Canvas instantiation, is active. Later units deliver durable mock-provider generation transactions and responsive Canvas resource/generation UI plus closure; templates remain versioned, quotas backend-authoritative, and automated provider evidence mock-only.

### T5-009 through T5-011

These Tasks apply the accepted visual system to the rest of the product, then close V2 with full regression and durable evidence.

## Canvas First-Acceptance Gate

T5-008 passes only when `ai/requirements/REVID-V2-CANVAS-ACCEPTANCE.md` is satisfied, including:

- create, rename, reorder, switch, and duplicate canvas;
- isolated graph, viewport, undo/redo, and edit history per canvas;
- project-shared assets and generation history;
- negative coordinates, 10% to 800% zoom, minimap, grid, edge visibility, fit, and arrange;
- command-based selection, multi-move, duplicate, group, ungroup, connect, delete, undo, and redo;
- 200 nodes and 300 connections with the recorded performance thresholds;
- autosave, 409 conflict, idempotency, revision restore, refresh, and backend restart;
- Chromium at 1440x900, 1366x768, 920x900, and 375x812;
- mobile review-only boundary, keyboard-only operation, reduced motion, and WCAG AA;
- MySQL comments, constraints, revision, persistence, and security hygiene.

## Non-Goals For This Roadmap

- real-time collaboration or presence;
- cross-canvas edges;
- mobile graph editing;
- second Canvas engine;
- audio generation or director console in Canvas first acceptance;
- automatic local `.db` deletion;
- paid provider calls without action-time authorization;
- cloud deployment, billing redesign, or public API version migration.

## Human Gates

On 2026-07-13, the Human Owner authorized scheduled Revid delivery to perform normal project-local implementation, verification, Git commit, and `origin` push work without asking again for each run. This authorization is limited to this repository and does not permit secret access, paid API calls, external accounts, operations outside the project, or destructive user/production-data operations.

- determine and perform credential rotation if the redacted tracked assignment was ever real;
- approve exact-path quarantine or deletion of ignored `.db` artifacts after backup and parity evidence;
- authorize paid Agnes real smoke;
- authorize destructive or irreversible MySQL operations;
- approve a new ADR for collaboration, cross-canvas edges, or Canvas engine replacement.

## Historical Status

Phase 4 completed with PASS on 2026-07-12. Its Tasks, reports, reviews, and as-built UI documentation remain historical evidence and are not rewritten by V2.
