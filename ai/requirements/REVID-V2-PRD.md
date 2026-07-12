# Revid Product V2 PRD

- Status: Approved target
- Version: 2.0
- Date: 2026-07-12
- Product owner: Human Owner
- Engineering owner: Codex Project Lead Engineer
- Delivery phase: Phase 5

## 1. Product Thesis

Revid V2 is a desktop-first AI video creation workspace built around a premium dark-purple infinite Canvas. The Canvas is the product surface, not a panel inside a traditional admin shell. Creators organize script, prompt, media, generation tasks, results, and notes into multiple independent canvases inside one project, while project assets remain reusable everywhere.

The first V2 acceptance milestone is Canvas. Global page redesign follows only after the Canvas milestone passes functional, performance, browser, accessibility, MySQL persistence, and security gates.

## 2. Evidence Behind The Direction

The direction is based on:

- Human Owner acceptance of the Phase 4 initial version;
- explicit MySQL-only, premium dark-purple, Canvas-first, and multi-canvas decisions;
- live read-only and authorized interaction benchmarking of libTv Canvas;
- inspection of Revid's current Vue, Leafer UI, Pinia, FastAPI, SQLAlchemy, MySQL, and Alembic implementation;
- observed Phase 4 gaps: conflicting light and dark themes, hidden Canvas grid, permanent inspector, project-only graph scope, full renderer rebuilds, no undo/redo or history, and no negative coordinates.

## 3. Primary User And Context

The primary user is a single authenticated creator working in desktop Chrome on an AI-assisted video project. The user spends long sessions arranging media and generation steps, so the interface must reduce glare, preserve spatial memory, support keyboard-heavy operation, and make save state visible.

Premise collapse: this plan assumes single-user creation is the first V2 market. If real-time team collaboration becomes primary, tenancy, presence, operation ordering, and conflict semantics require a new product and architecture ADR before implementation.

## 4. Locked Decisions

- MySQL 8 is the only database for runtime and database-backed tests.
- SQLite runtime, fallback, migration tooling, dependencies, and tests are retired.
- A project owns multiple canvases.
- The Canvas engine remains Leafer UI.
- UI styling uses SCSS tokens, scoped SCSS, and Naive UI overrides. Tailwind and a second UI library are not introduced.
- The visual system is graphite-black with violet-tinted surfaces and one violet interaction accent.
- Desktop editing is primary. Mobile is browse and review only.
- Real-time collaboration is deferred.
- Canvas performance acceptance uses 200 nodes and 300 connections.
- Project assets are shared across canvases; graph and edit history are canvas-scoped.

## 5. Goals

### 5.1 Canvas-first workspace

- Canvas occupies the full working viewport.
- Project and canvas identity remain compact and always discoverable.
- Tools, view controls, assets, and inspector appear contextually and do not permanently consume the main surface.
- Empty canvases offer useful workflow starters without forcing generation.

### 5.2 Multi-canvas project structure

- create, rename, switch, reorder, and duplicate canvases;
- save and restore graph, viewport, and history independently;
- preserve project-shared assets and generation history;
- prohibit cross-canvas edges.

### 5.3 Reliable creative editing

- select, marquee-select, move, multi-move, duplicate, group, ungroup, connect, delete, align, and auto-arrange;
- keyboard shortcuts and pointer interactions use the same command model;
- undo and redo retain at least 100 local commands per active canvas;
- autosave is visible and conflicts never overwrite silently;
- durable revisions allow recovery to a prior graph state.

### 5.4 Media and generation workflow

The first-acceptance node registry contains:

- `script`: script or structured prompt content;
- `note`: non-generating annotation;
- `asset`: image, video, or audio project asset;
- `generation`: a configured generation task;
- `result`: a generated output linked to its task and project asset;
- `group`: a visual and logical node collection.

Audio generation, director console, and cross-canvas automation are not first-acceptance commitments.

### 5.5 Unified V2 visual system

- eliminate the current light token and dark component conflict;
- use one dark-purple token source across Login, Home, Workspace, Space, and Admin;
- keep semantic success, warning, and error differentiation while all containers remain within the dark-purple surface family;
- meet WCAG AA text contrast, visible focus, and reduced-motion requirements.

## 6. Non-Goals

- real-time multi-user collaboration or presence;
- cross-canvas connections;
- mobile graph editing, deletion, or generation;
- a second Canvas engine or graph library;
- paid Agnes calls without explicit action-time authorization;
- automatic deletion of local `.db` files or user MySQL data;
- production deployment, cloud tenancy, billing redesign, or a public API version migration;
- audio generation and director console in Canvas first acceptance.

## 7. Core User Journeys

### 7.1 Start a project

1. The user creates or opens a project.
2. Revid opens the last active canvas recorded in browser storage for the current user and project; if that ID is missing, archived, or foreign, it falls back to the project's first active canvas and replaces the stale preference.
3. A new project has `画布 1` and a focused empty-state guide.
4. The user starts from a blank canvas, a workflow starter, or an existing project asset.

### 7.2 Organize a complex workflow

1. The user creates canvases for script, visual development, shots, and assembly.
2. Canvas switching flushes pending saves before navigation.
3. Each canvas restores its own viewport and selection-safe graph state.
4. Project assets remain available without copying ownership.

### 7.3 Build and edit a graph

1. The user adds nodes from the tool dock, Tab shortcut, double-click menu, or asset panel.
2. The user connects compatible ports, groups related nodes, duplicates structures, and uses auto-arrange.
3. Every change enters one command history and one debounced save queue.
4. Save status reports `Saving`, `Saved`, `Error`, or `Conflict` without hiding unsaved work.

### 7.4 Recover from a conflict or mistake

1. Local undo/redo handles normal editing.
2. A stale base revision returns HTTP 409 and never overwrites server state.
3. Revid offers reload-latest and preserve-local-copy recovery actions.
4. Durable revision restore creates a new head revision instead of rewriting history.

## 8. Success Metrics

Canvas first acceptance passes only when:

- 200 nodes and 300 connections load, save, close, reopen, and retain graph identity;
- a 30-second pan, zoom, and drag profile averages at least 55 FPS on the recorded reference Windows Chrome environment;
- p95 frame interval is at most 33 ms, pointer feedback p95 is at most 50 ms, and no interaction long task reaches 200 ms;
- local MySQL graph load completes within 3 seconds at the acceptance scale;
- autosave reaches `Saved` within 1 second after the final interaction under normal local conditions;
- create, rename, switch, reorder, and duplicate canvas survive browser refresh and backend restart;
- stale revisions return 409 and do not silently overwrite;
- Chrome checks pass at 1440x900, 1366x768, 920x900, and 375x812;
- 375px presents browse and review controls without destructive or generation actions;
- keyboard-only Canvas review, focus visibility, reduced motion, and WCAG AA checks pass;
- MySQL current revision equals Alembic head and all new schema comments and foreign keys are present;
- repository, staged diff, and browser evidence pass secret hygiene checks.

## 9. Release Sequence

1. V2 documentation and architecture baseline.
2. P0 credential cleanup and complete MySQL-only retirement.
3. Multi-canvas schema, backfill, API, and default-canvas compatibility.
4. V2 token foundation, full-screen Canvas shell, and multi-canvas navigation.
5. Incremental renderer, command interactions, grouping, shortcuts, and performance work.
6. Autosave, optimistic conflicts, revisions, and recovery.
7. Node registry, project assets, templates, and generation integration.
8. Canvas first-acceptance E2E, performance, browser, accessibility, and security closure.
9. Global app-shell and page-level V2 UI rollout.
10. Final V2 regression and documentation closure.

Each phase must be independently mergeable and leave the repository usable.

## 10. Human Gates

- rotate any credential associated with the redacted hard-coded assignment if it was ever real;
- authorize deletion or quarantine of the exact ignored `.db` artifacts after parity and backup evidence;
- authorize paid Agnes real smoke calls;
- authorize destructive or irreversible MySQL operations;
- approve a new ADR before real-time collaboration, cross-canvas edges, or Canvas engine replacement.

## 11. Source Documents

- Canvas acceptance: `ai/requirements/REVID-V2-CANVAS-ACCEPTANCE.md`
- Canvas architecture: `ai/architecture/REVID-V2-CANVAS-ARCHITECTURE.md`
- V2 design system: `ui/REVID-V2-DESIGN-SYSTEM.md`
- MySQL-only ADR: `ai/decisions/ADR-004-mysql-only-runtime-and-tests.md`
- Multi-canvas ADR: `ai/decisions/ADR-005-project-multi-canvas.md`
- Delivery roadmap: `ai/state/ROADMAP.md`
