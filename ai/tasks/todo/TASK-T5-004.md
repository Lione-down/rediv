# TASK-T5-004 - V2 Canvas shell, navigation, and viewport persistence

- State: `DOING`
- Phase: Product V2 / Phase 5
- Dependency: T5-003 `DONE - PASS`
- Owner: Codex Project Lead Engineer
- Started: 2026-07-13

## Objective

Move the frontend from the Phase 4 project-scoped workspace into the explicit multi-canvas V2 route and a full-screen, premium dark-purple Canvas shell, with independent viewport restoration per Canvas.

## Scope

- one Canvas-scoped source of truth for V2 color, typography, spacing, radius, elevation, motion, and accessibility tokens;
- canonical `/app/projects/:projectId/canvases/:canvasId` route and Phase 4 workspace compatibility redirect;
- authenticated Canvas metadata navigation for create, rename, reorder, switch, archive, and duplicate;
- full-screen Canvas route chrome without a permanent app bar or empty inspector;
- Canvas-scoped graph loading and viewport load/save behavior;
- desktop edit, compact tablet, and mobile review-only boundaries;
- focused frontend build, browser, responsive, keyboard, reduced-motion, and persistence evidence.

## Non-goals

- renderer command model, grouping, connection workflow, keyboard command expansion, or arrange behavior (T5-005);
- autosave conflict queue, durable graph revisions, checkpoints, or restore UI (T5-006);
- node registry, generation provider flows, or project-shared asset redesign (T5-007);
- global Home, Space, Admin, auth, or error-page V2 redesign before Canvas acceptance;
- applying migrations to user/runtime data, paid provider calls, or destructive local data cleanup.

## Delivery Units

1. Unit A - scoped single-source V2 Canvas tokens and Naive UI variable bridge.
2. Unit B - explicit Canvas metadata client/store and canonical route resolution.
3. Unit C - full-screen Canvas shell and navigation interactions on the canonical route.
4. Unit D - Canvas-scoped graph loading and debounced viewport persistence.
5. Unit E - focused browser, responsive, accessibility, regression, and Task closure evidence.

## Acceptance Criteria

- [x] V2 Canvas semantic tokens have one value source and drive Canvas CSS plus Canvas-local Naive UI overrides without changing unrelated pages.
- [x] The canonical route contains valid project and Canvas IDs; the legacy workspace resolves the first active Canvas without flattening multi-canvas data.
- [x] Canvas navigation supports create, rename, reorder, switch, archive, and duplicate with optimistic order-revision handling.
- [x] The Canvas is full-screen with floating route chrome, no permanent empty inspector, and clear project, Canvas, back, save, and recovery context.
- [ ] Graph reads and mutations use an explicit Canvas ID and never leak data across canvases.
- [ ] Pan/zoom restores independently per Canvas after switch, refresh, and backend restart, with bounded/debounced persistence.
- [x] Desktop and compact editing remain usable, while widths below 768 px expose browse/review only and no graph mutation controls.
- [ ] Keyboard focus, skip-to-content, 40x40 targets, reduced motion, Chinese labels, and required contrast survive browser verification.
- [ ] Focused tests, frontend build, relevant browser checks, fresh diff review, and hygiene gates pass.

## Linked Decisions And Specifications

- `ai/decisions/ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md`
- `ai/decisions/ADR-004-mysql-only-runtime-and-tests.md`
- `ai/decisions/ADR-005-project-multi-canvas.md`
- `ai/requirements/REVID-V2-PRD.md`
- `ai/requirements/REVID-V2-CANVAS-ACCEPTANCE.md`
- `ai/architecture/REVID-V2-CANVAS-ARCHITECTURE.md`
- `ui/REVID-V2-DESIGN-SYSTEM.md`

## Risks And Controls

- Global visual regression: scope V2 variables and Naive overrides to the Canvas route until T5-009.
- Route/data mismatch: validate both IDs and fail closed rather than falling back to project-wide graph data.
- Stale optimistic ordering: retain the server revision, surface 409 recovery, and never predict a successful order.
- Excess viewport writes: debounce and deduplicate normalized viewport state before persistence.
- Mobile mutation leakage: enforce the review-only boundary in rendered controls and command handlers, not CSS visibility alone.
