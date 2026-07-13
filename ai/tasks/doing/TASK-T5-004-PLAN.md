# TASK-T5-004 Plan

- State: `DOING`
- Completed unit: Unit B - Canvas metadata client/store and canonical route resolution (`COMPLETE - PASS`)
- Completed unit: Unit C - full-screen Canvas shell and navigation interactions (`COMPLETE - PASS`)
- Next unit: Unit D - Canvas-scoped graph loading and viewport persistence
- Completed unit: Unit A - single-source V2 Canvas token foundation (`COMPLETE - PASS`)
- Updated: 2026-07-13

## Objective

Deliver the explicit multi-canvas frontend in independently mergeable units while keeping every non-Canvas page on its current Phase 4 visual contract until the Canvas milestone is accepted.

## Direction Lock

- Visual thesis: dense premium graphite-black creative workspace with quiet violet interaction accents and depth expressed through surface lightness, not glass or decorative gradients.
- Content plan: orient with project and Canvas identity, expose Canvas navigation and save state, then leave the graph/media workflow as the dominant surface.
- Interaction thesis: 100-180 ms transform/opacity transitions, interruptible 0.96 press scale, contextual surfaces translated by at most 8 px, and reduced-motion parity.
- CSS strategy: existing global/scoped SCSS only; Naive UI consumes the same Canvas CSS variables through a route-local theme bridge.
- Benchmarks already approved by the V2 source documents: Figma for contextual creative-tool chrome, Miro for spatial navigation and viewport continuity, and Linear for compact state feedback and keyboard legibility.

## Unit A - Single-source V2 Canvas tokens

### Scope

1. Add one SCSS source for all approved V2 Canvas semantic values: surfaces, text, accent/status, borders, spacing, radii, typography, elevation, motion, grid, focus, and responsive thresholds.
2. Expose the variables only through a Canvas theme scope so current Home, Space, auth, and Admin pages do not receive a premature V2 redesign.
3. Add a Canvas-local Naive UI override object whose values reference the scoped CSS variables rather than duplicating color or radius literals.
4. Keep the new bridge unused until the canonical shell lands in Unit C; Unit A must not alter rendered routes or application behavior.

### Non-goals

- router, API, store, component, or runtime theme-provider changes;
- Phase 4 token cleanup or global page redesign;
- Canvas navigation, viewport persistence, browser screenshot acceptance, or backend changes.

### Success criteria

- Every approved V2 Canvas value is declared once in the SCSS token source.
- The Naive bridge contains no duplicated color/radius value literals and TypeScript accepts it.
- Existing frontend build output remains successful and no rendered route is changed by this unit.
- Fresh diff review, `git diff --check`, exact staging, UTF-8, sensitive-path, secret-candidate, and tracked database-artifact gates pass.

### Outcome

- Frontend metadata types and API paths mirror the strict backend list, item, create, rename, reorder, archive, and duplicate contracts.
- The project-scoped list store serializes mutations, adopts only server-returned items and order revisions, reloads after stale-order conflicts, and rejects responses from stale auth/project generations.
- Legacy project entry resolves the first ordered active Canvas, canonical routes validate project ownership and active membership, and invalid Canvas IDs redirect without entering graph loading under that ID.
- Browser-local last-opened identity is keyed by authenticated user and project and accepted only against the loaded active list.
- Focused metadata tests, canonical/legacy browser routes, full existing browser regression, production build, diff review, and hygiene gates passed.

## Unit B - Canvas metadata client, store, and route resolution

### Scope

1. Mirror the strict backend Canvas list, item, mutation, reorder, archive, and duplication contracts in the frontend metadata API without changing backend behavior.
2. Add one project-scoped Canvas list store that serializes metadata mutations, keeps the server-returned `order_revision`, and refreshes from the server after a stale-revision conflict instead of predicting a successful order.
3. Add the canonical `/app/projects/:projectId/canvases/:canvasId` route while temporarily rendering the existing Workspace until the Unit C shell lands.
4. Resolve `/app/workspace?project_id=...` through the backend's ordered active list to its first Canvas, and validate canonical project/Canvas membership before the Workspace can load project-scoped compatibility graph data.
5. Keep last-opened Canvas preference browser-local and keyed by authenticated user plus project; accept it only when it belongs to the loaded active list.
6. Extend mock browser coverage for valid canonical entry, legacy first-active resolution, stale/foreign Canvas fallback, mutation revision handling, and authentication on Canvas metadata requests.

### Non-goals

- V2 shell, navigation controls, dialogs, visual provider, or page-level redesign;
- explicit Canvas graph/document APIs, viewport writes, save flushing, or renderer changes;
- backend schema/API changes, MySQL access, migration execution, or real-service calls;
- replacing the existing Workspace compatibility graph load before Unit D.

### Success criteria

- Every metadata request uses encoded project/Canvas path segments and matches the backend response/payload field names.
- Metadata mutations are serialized; UI state adopts only server-returned items/revisions, and HTTP 409 stores the reported revision then reloads the active list before surfacing the error.
- A legacy route with a valid project reaches the first active Canvas canonical URL; a canonical foreign, archived, or missing Canvas ID never reaches graph loading under that ID.
- The canonical Workspace receives its project ID from route params while legacy project-scoped graph compatibility remains usable.
- Focused Playwright route/store-contract coverage and the frontend production build pass.
- Fresh diff review, `git diff --check`, exact staging, UTF-8, sensitive-path, secret-candidate, and tracked database-artifact gates pass.

## Unit C - Full-screen Canvas shell and navigation interactions

### Scope

1. Move only the canonical Canvas route to a dedicated `CanvasWorkspace.vue`; keep the legacy Phase 4 `Workspace.vue` as historical compatibility code and do not alter non-Canvas routes.
2. Apply `.v2-canvas-theme`, `darkTheme`, and `v2CanvasNaiveTheme` through a route-local provider so the approved token source drives every Canvas-local Naive surface.
3. Render a `100dvh` shell with skip-to-content, compact top-left project/Canvas identity, top-right save/recovery/account context, the existing graph stage as the dominant surface, and no permanent app bar, inspector, or prompt dock.
4. Add project-scoped Canvas navigation for switch, create, inline rename, move earlier/later, duplicate, and archive. All mutations use the existing serialized metadata store and server-returned `order_revision`; route changes occur only after mutation success.
5. Keep destructive archive review-first and disabled for the last active Canvas. Surface loading, mutation, and recovery errors with specific Chinese retry guidance.
6. Enforce the below-768-px review boundary in rendered shell controls by removing Canvas metadata mutation actions while retaining back, identity, switch, status, pan, and inspect context.
7. Add focused Playwright coverage for the full metadata interaction sequence, route switching, last-active protection, stale-revision recovery, skip link, 40px targets, reduced motion, and desktop/compact/mobile rendered boundaries.

### Non-goals

- explicit Canvas document endpoints, graph store scoping, save flushing, autosave state, or viewport persistence;
- renderer, node command, generation workflow, asset panel, inspector, history, or view-control redesign;
- backend, schema, migration, MySQL, paid-provider, secret, or local database changes;
- global V2 app shell or Phase 4 page restyling.

### Success criteria

- The canonical route renders the dedicated full-screen V2 shell, while unrelated routes retain the Phase 4 theme and layout.
- Create, rename, reorder, switch, duplicate, and archive requests match the existing metadata contracts and route only from server-confirmed active items.
- The last active Canvas cannot expose an enabled archive action; HTTP 409 reloads the list and leaves a visible recovery message.
- Desktop and compact widths expose editing navigation, while mobile renders a labelled review-only state with no metadata mutation controls.
- Skip-to-content, visible focus, Chinese labels, at least 40x40 targets, and reduced-motion substitutions are present in the rendered browser.
- Focused browser tests, the full frontend Chromium regression, production build, fresh diff review, `git diff --check`, exact staging, UTF-8, sensitive-path, secret-candidate, and tracked database-artifact gates pass.

### Outcome

- The canonical route now renders a dedicated `100dvh` V2 Canvas shell with route-local Naive theme overrides, compact Revid/project/Canvas identity, save/recovery context, no permanent app bar or inspector, and contextual generation only after selection.
- Canvas create, rename, reorder, switch, duplicate, and archive adopt server-confirmed items and revisions; stale reorder reloads the list before exposing retry, and the last active Canvas has no enabled archive path.
- Mobile uses a reactive rendered `readonly` boundary that blocks node drag, connect, create, delete, context-menu, and keyboard mutation paths while retaining selection, pan, zoom, and Canvas switch review.
- The focused shell suite passed 4 tests; the full Chromium suite passed 12 tests across 1440x900, 1366x768, 920x900, and 375x812; the production build passed with 4711 modules.

## Later Units

- Unit D: explicit Canvas graph scope and normalized debounced viewport persistence.
- Unit E: focused and regression browser evidence, accessibility/reduced-motion checks, documentation, REPORT, and closure reconciliation.

## Unit A Outcome

- The scoped SCSS source defines 61 V2 Canvas tokens and reduced-motion substitutions under `.v2-canvas-theme`.
- The Canvas-local Naive UI bridge references 27 semantic variables with zero duplicated color literals and zero unresolved token names.
- Global SCSS compiles the dormant theme class, but no route, provider, component, or unrelated page applies it before Unit C.
- Frontend production build and focused static token/forbidden-pattern checks pass.

## Verification Order

1. Run Unit D focused document/viewport tests before broader browser regression.
2. Run `npm run build` from `frontend`.
3. Inspect explicit Canvas IDs across graph API, stores, route switching, and viewport deduplication.
4. Run the full relevant Chromium suite, fresh diff review, and `git diff --check`.
5. Precisely stage owned paths, run staged UTF-8/sensitive-path/secret/database-artifact checks, commit, and push.
