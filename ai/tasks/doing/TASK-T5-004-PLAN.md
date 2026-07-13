# TASK-T5-004 Plan

- State: `DONE - PASS`
- Completed unit: Unit B - Canvas metadata client/store and canonical route resolution (`COMPLETE - PASS`)
- Completed unit: Unit C - full-screen Canvas shell and navigation interactions (`COMPLETE - PASS`)
- Completed unit: Unit D - Canvas-scoped graph loading and viewport persistence (`COMPLETE - PASS`)
- Completed unit: Unit E - focused closure evidence and Task reconciliation (`COMPLETE - PASS`)
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

## Unit D - Canvas-scoped graph loading and viewport persistence

### Scope

1. Add authenticated Canvas document and viewport endpoints under the canonical project/Canvas path. A document read returns active Canvas metadata, nodes, connections, and the current graph revision from one Canvas-scoped read boundary.
2. Add explicit Canvas-scoped node and connection mutation paths for the existing immediate-edit workflow. Every read and mutation validates user ownership plus the exact active `project_id` and `canvas_id`; legacy project-scoped routes remain only as first-Canvas compatibility paths.
3. Move the canonical frontend store context from project-only identity to exact project/Canvas identity, load one document response, and reject stale responses after route, auth, or document generation changes.
4. Send canonical node create/update/delete and connection create/delete requests through the exact Canvas-scoped paths while preserving the current optimistic rollback and pending-move behavior.
5. Restore the server viewport for each Canvas and persist normalized finite `x`, `y`, and `zoom` through a separate deduplicated debounce. Flush pending node movement and viewport work before Canvas switch, route exit, and unmount.
6. Keep the verified Unit C shell, mobile review boundary, renderer behavior, generation compatibility, and non-Canvas routes unchanged except for the document identity and save-state data they consume.
7. Add guarded MySQL API evidence for isolation, authorization, document consistency, mutation scope, viewport normalization, deduplication semantics, and restart persistence; add focused Playwright evidence for exact request paths, switch isolation, refresh restoration, and bounded viewport writes.

### Non-goals

- graph revision mutation batches, `client_mutation_id`, conflict recovery, command history, checkpoints, or autosave queue behavior owned by T5-006;
- incremental renderer, command model, grouping, shortcut expansion, arrange, or performance work owned by T5-005;
- migration execution against user/runtime data, paid provider calls, secret access, local database cleanup, or removal of the legacy compatibility APIs;
- Unit C shell redesign or global V2 page rollout.

### Success criteria

- Canonical graph load uses one authenticated `GET /api/projects/{project_id}/canvases/{canvas_id}/document`; canonical graph mutations contain both encoded identifiers and cannot read or mutate another Canvas.
- The document response is internally Canvas-consistent and includes Canvas metadata, nodes, connections, and revision; unauthorized, foreign, archived, and cross-Canvas entity access fail closed.
- Viewport values restore independently per Canvas, are finite and normalized, persist through a separate debounced endpoint without advancing graph revision, and flush before navigation.
- Switching and refresh never display a stale prior-Canvas graph or accept a stale in-flight response.
- Focused backend and browser tests, frontend production build, relevant regression, fresh diff review, `git diff --check`, exact staging, UTF-8, sensitive-path, secret-candidate, and tracked database-artifact gates pass.

### Outcome

- Added one authenticated Canvas document boundary plus explicit Canvas-scoped node and connection mutation routes; every operation checks user, project, active Canvas, and exact entity scope.
- Canonical frontend loading now keys state and stale-response guards by project plus Canvas, adopts one document response, and sends graph mutations only through encoded Canvas-scoped paths.
- Viewport state is finite, normalized, deduplicated, debounced separately, and flushed together with pending node movement before route updates, route exit, page hide, and unmount without advancing graph revision.
- Guarded MySQL evidence passed Canvas isolation, authorization, negative coordinates, exact mutation lifecycle, viewport normalization, unchanged graph revision, and restart persistence.
- Full backend passed 189 tests, full Chromium passed 14 tests across the required viewport matrix, and the final `vue-tsc` plus Vite build passed with 4711 modules.

## Unit E - Accessibility, browser closure, and Task reconciliation

### Scope

1. Correct the canonical document language to `zh-CN` so the rendered Chinese Canvas is announced with the right language context.
2. Close the two evidenced Canvas accessibility gaps without redesign: retain a 40x40 Canvas-switch target and suppress hard-coded dash, pulse, and spin animation under `prefers-reduced-motion: reduce`.
3. Add focused browser evidence for first-focus skip navigation, visible focus, route-control target geometry, Chinese labels and document language, reduced-motion behavior, and computed text/focus contrast.
4. Run the four required viewport checks, full Chromium regression, production build, and fresh acceptance/diff/hygiene review.
5. Write `REPORT-T5-004.md` and reconcile Task, PLAN, PROGRESS, CURRENT, and ROADMAP only when every T5-004 acceptance criterion passes.

### Non-goals

- renderer command model, Canvas accessibility node-list expansion, grouping, shortcuts, arrange, or performance work owned by T5-005/T5-008;
- graph revision batching, autosave conflict recovery, history, checkpoints, or restore owned by T5-006;
- global page redesign, migration execution, paid calls, secret access, or destructive database/filesystem work.

### Success criteria

- Chromium reports `zh-CN`, the skip link is first and moves focus to Canvas main content, and focus styling remains visible.
- Every tested route-chrome control retains at least 40x40 px at desktop, compact, narrow, and mobile widths.
- Reduced motion removes Canvas dash, pulse, spin, transition-duration, and press-scale motion without removing status meaning.
- Browser-computed text and focus-ring contrast meet the Task thresholds on their actual Canvas surfaces.
- Focused browser checks, full Chromium regression, production build, fresh diff review, `git diff --check`, exact staging, UTF-8, sensitive-path, secret-candidate, and database-artifact gates pass.

### Outcome

- Corrected the root language to `zh-CN`, restored the Canvas switch target to 40px, and removed stage dash, pulse, and spin animation under reduced motion.
- Browser-computed focus contrast exposed a 2.52:1 token gap; increasing only the shared focus-ring alpha to 0.64 brought the rendered ring above the 3:1 gate while preserving the approved violet direction.
- The focused Canvas shell suite passed 6 tests, the full Chromium suite passed 16 tests, the production build passed with 4711 modules, and all four required workspace screenshots passed visual review.
- REPORT and durable Task state agree on `DONE - PASS`; T5-005 remains unstarted.

## Unit A Outcome

- The scoped SCSS source defines 61 V2 Canvas tokens and reduced-motion substitutions under `.v2-canvas-theme`.
- The Canvas-local Naive UI bridge references 27 semantic variables with zero duplicated color literals and zero unresolved token names.
- Global SCSS compiles the dormant theme class, but no route, provider, component, or unrelated page applies it before Unit C.
- Frontend production build and focused static token/forbidden-pattern checks pass.

## Verification Order

1. Run Unit E focused keyboard, focus, reduced-motion, contrast, responsive, and recovery checks before broader regression.
2. Run `npm run build` from `frontend` and the relevant backend regression if closure changes shared contracts.
3. Reconcile every remaining T5-004 acceptance criterion against browser, source, and runtime evidence.
4. Run the full relevant Chromium suite, fresh Task/diff review, and `git diff --check`.
5. Precisely stage owned paths, run staged UTF-8/sensitive-path/secret/database-artifact checks, commit, and push.
