# Revid Product V2 / Phase 5 Direct Delivery Roadmap

Last updated: 2026-07-15

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
| 7 | T5-007 | Node registry, project-shared assets/templates, generation tasks/results, and mock provider flows | DONE - PASS | T5-006 |
| 8 | T5-008 | Canvas first-acceptance E2E, 200/300 performance, browser, visual, accessibility, MySQL, and security closure | DONE - PASS | T5-007 |
| 9 | T5-009 | Global V2 app-shell and shared-component dark-purple rollout without Canvas regression | DONE - PASS | T5-008 |
| 10 | T5-010 | Login, Home, Space, Admin, error, empty, loading, and responsive V2 UX upgrade | DONE - PASS | T5-009 |
| 11 | T5-011 | Full V2 regression, real-runtime verification, security review, documentation, and release closure | DONE - PASS | T5-010 |
| 12 | T5-012 | Restore Canvas workspace rendering with Naive UI theme compatibility | DONE - PASS | T5-011 |
| 13 | T5-013 | Repair Canvas node editing, generation lifecycle, and connections | DONE - PASS | T5-012 |
| 14 | T5-014 | LibTV-inspired Canvas visual parity for node geometry, media, editing, ports, and passive edges | DONE - PASS | T5-013 |
| 15 | T5-015 | Reference-backed Canvas refinement for media-shaped nodes, quiet graph chrome, and contextual tools | DONE - PASS | T5-014 |
| 16 | T5-016 | Multi-scenario Canvas and node validation across mixed media, graph topology, lifecycle, density, and viewports | DONE - PASS | T5-015 |
| 17 | T5-017 | Connected scripts and media become visible, validated image/video generation context | DONE - PASS | T5-016 |
| 18 | T5-018 | Drag-edge continuation into compatible new typed nodes with atomic insertion | DONE - PASS | T5-017 |
| 19 | T5-019 | Reverse typed port dragging and upstream continuation | DONE - PASS | T5-018 |
| 20 | T5-020 | Direct edge selection and typed endpoint rerouting | DONE - PASS | T5-019 |
| 21 | T5-021 | Atomic typed node insertion into an existing edge | DONE - PASS | T5-020 |
| 22 | T5-022 | Generation input provenance spotlight and deterministic ordering | DONE - PASS | T5-021 |
| 23 | T5-023 | Result lineage and sibling variant inspection | DONE - PASS | T5-022 |
| 24 | T5-024 | In-canvas sibling result comparison tray | DONE - PASS | T5-023 |
| 25 | T5-025 | Multi-input generation request preflight | DONE - PASS | T5-024 |
| 26 | T5-026 | Undoable generation input ordering | DONE - PASS | T5-025 |
| 27 | T5-027 | Generation node run history | DONE - PASS | T5-026 |
| 43 | T5-043 | Align Agnes image and video provider contracts | DONE - PASS | T5-042 |
| 44 | T5-044 | Zoom-consistent generation composer geometry | DONE - PASS | T5-043 |
| 45 | T5-045 | Proportional node status badges at overview zoom | DONE - PASS | T5-044 |
| 46 | T5-046 | Zoom-consistent media fallback content | DONE - PASS | T5-045 |
| 47 | T5-047 | Proportional provenance markers at overview zoom | DONE - PASS | T5-046 |
| 48 | T5-048 | Video current-frame reuse as Canvas image input | DONE - PASS | T5-047 |
| 49 | T5-049 | Captured-frame provenance and repeat capture loop | DONE - PASS | T5-048 |
| 50 | T5-050 | Selection-order composition preflight | DONE - PASS | T5-049 |
| 51 | T5-051 | Reorderable composition preflight | DONE - PASS | T5-050 |
| 52 | T5-052 | Dense composition preflight scalability | DONE - PASS | T5-051 |
| 53 | T5-053 | Selected edge semantic identity | DONE - PASS | T5-052 |
| 54 | T5-054 | Ordered multi-generation edge identity | DONE - PASS | T5-053 |
| 55 | T5-055 | Arrange authoritative generation lineage | DONE - PASS | T5-054 |
| 56 | T5-056 | Chained generation input lineage bridge | DONE - PASS | T5-055 |

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

T5-007 is `DONE - PASS`. Units A-E delivered registry-driven canonical/legacy/unknown node behavior, guarded resource-origin and versioned-template schema through Alembic head `c9d0e1f2a3b4`, project-shared assets and generation history, atomic template instantiation, idempotent no-charge-on-failure generation transactions, backend-authoritative quota snapshots, responsive resource/generation controls, and the 375px review-only boundary. Upload closure adds bounded cross-process reservations, same-volume streaming staging, idle/total deadlines, cancellation-safe disk lifecycle, real decodable media validation, CPU/sample/decoded-size budgets, and patched multipart dependency bounds. Final evidence passed 384 backend tests plus 56 subtests, 117 Chromium tests, a 4,761-module build, four-viewport visual/accessibility checks, and independent review at 0 HIGH / 0 MEDIUM / 0 LOW. `REPORT-T5-007.md` is authoritative; automated provider evidence remains mock-only.

T5-008 is `DONE - PASS`. The reproducible live boundary owned a unique guarded `revid_test_*` schema, production FastAPI/Vite processes, exact backend health and preview identity, redacted retained evidence, and cleanup. The final live run proved 200 nodes/300 connections, restart checksum, idempotency/409, 30-second performance, four viewport screenshots, mobile review-only behavior, security rejection, full backend (438) and full Chromium (131) regression. `REPORT-T5-008.md` is authoritative.

### T5-009 through T5-011

These Tasks apply the accepted visual system to the rest of the product, then close V2 with full regression and durable evidence.

T5-013 is `DONE - PASS`. Canonical node-local editing, outcome-safe durable generation reconciliation, visible native image/video results, explicit unavailable media, and directional typed connection feedback passed 140 Chromium tests, 20 backend generation tests plus 3 subtests, a 4,775-module build, and the guarded live 200-node/300-connection boundary. `REPORT-T5-013.md` is authoritative.

T5-014 is `DONE - PASS`. Typed semantic node geometry, intrinsic-ratio native media with one visible result surface, detached contextual authoring, passive Canvas edges with Graph Access management, restrained status hierarchy, four-viewport screenshots, full Chromium 147/147, and guarded live 200/300 evidence are recorded in `REPORT-T5-014.md`.

T5-015 is `DONE - PASS`. Media outer geometry follows intrinsic ratio, text and generation nodes are content-sized, decoded metadata repairs missing ratios, persisted edges and idle ports recede, and contextual tools are lighter and viewport-aware. Public LibTV screenshots and the MIT AIGCCanvasFlow source informed general hierarchy patterns only; Revid branding, engine, copy, tokens, and capabilities remain independent. `REPORT-T5-015.md` is authoritative evidence.

T5-016 is `DONE - PASS`. It expands visual acceptance from one representative graph to a deterministic matrix covering mixed image/video media, four-way convergence, six-way branching, lifecycle and unavailable states, localized content extremes, dense topology, interaction states, and every supported viewport. Focused 26/26, full Chromium 150/150, build, mock-browser performance, and guarded live 200/300 evidence passed. `REPORT-T5-016.md` is authoritative evidence.

T5-017 is `DONE - PASS`. Typed upstream scripts and image/result connections now become the actual deterministic prompt and validated image-reference inputs used by image and video generation. The inspector exposes provenance and excluded inputs; one image maps to img2vid, multiple images to ordered keyframes. Focused frontend 24/24, guarded generation backend 29/29, full Chromium 155/155, build, viewport, and hygiene evidence passed. `REPORT-T5-017.md` is authoritative evidence.

T5-018 is `DONE - PASS`. Output-port dragging released on empty Canvas space now opens a registry-filtered typed continuation chooser. Selection creates one compatible node and one edge through a single `insert-graph` command, while click, Escape, outside click, pointer cancel, direct port drop, autosave, and undo/redo remain deterministic. Focused 8/8, relevant Chromium 50/50, full Chromium 163/163, build, visual, and hygiene evidence passed. `REPORT-T5-018.md` is authoritative evidence.

T5-019 is `DONE - PASS`. Input ports now initiate reverse typed dragging to compatible existing outputs or an upstream continuation chooser. Gesture direction is normalized into canonical source-to-target edge orientation, and upstream creation remains one atomic graph command. Focused 12/12, relevant Chromium 54/54, full Chromium 167/167, build, visual, and hygiene evidence passed. `REPORT-T5-019.md` is authoritative evidence.

T5-020 is `DONE - PASS`. Persisted edges now expose a generous invisible hit path, direct selection, and contextual source/target handles. Typed endpoint reroute preserves the connection ID, metadata, status, one autosave upsert, and one undo/redo entry while visible edges remain pointer-passive. Relevant 57/57, full Chromium 173/173, post-label focused 28/28, build, visual, and hygiene evidence passed. `REPORT-T5-020.md` is authoritative evidence.

T5-021 is `DONE - PASS`. A selected compatible edge now exposes one restrained midpoint insertion action. Two-sided canonical compatibility, same-ID upstream preservation, one downstream edge, one atomic PATCH/history entry, exact undo/redo, cancellation, readonly, viewport, and visual contracts passed focused 6/6, edge insertion plus reroute 11/11, full Chromium 179/179, build, and hygiene gates. `REPORT-T5-021.md` is authoritative evidence.

T5-022 is `DONE - PASS`. Selecting a generation node now exposes stable T/R input order, participating edge paths, source rings, and muted excluded references from the same resolver that builds provider payloads. Focused 6/6, related 39/39, full Chromium 182/182, build, desktop/mobile visual, and hygiene gates passed. `REPORT-T5-022.md` is authoritative evidence.

T5-023 is `DONE - PASS`. Selecting a canonical image/video result now traces one typed origin generation, ordered T/R inputs, stable V siblings, and source task/model metadata. Media state survives selection changes, including decoded, unavailable, and broken results. Focused 10/10, related 48/48, full Chromium 186/186, build, visual, and hygiene gates passed. `REPORT-T5-023.md` is authoritative evidence.

T5-024 is `DONE - PASS`. Selected result lineage now opens a non-modal Canvas comparison tray for all persisted sibling variants, including canonical images, user-controlled video, unavailable, and broken media. No-mutation, desktop/375px responsive, focused 6/6, related 9/9, full Chromium 188/188, build, visual, and hygiene gates passed. `REPORT-T5-024.md` is authoritative evidence.

T5-025 is `DONE - PASS`. The generation inspector now exposes an authoritative request preflight with exact composed prompt, ordered image references, video keyframe/img2vid semantics, and excluded inputs. Focused 3/3, related 14/14, full Chromium 191/191, build, visual, and hygiene gates passed. `REPORT-T5-025.md` is authoritative evidence.

T5-026 is `DONE - PASS`. Prompt and media inputs now have independently durable order through edge metadata, one atomic command, reload persistence, and exact undo/redo. Provenance, preflight, provider prompt, image IDs, and video keyframes share the same order resolver. Focused 7/7, related 29/29, full Chromium 195/195, build, visual, and hygiene gates passed. `REPORT-T5-026.md` is authoritative evidence.

T5-027 is `DONE - PASS`. Generation nodes now expose a compact node-scoped history of the latest five durable runs, total count, stable chronology, all five lifecycle states, timing/model identity, and bounded errors. Focused 3/3, related 30/30, full Chromium 198/198, build, visual, and hygiene gates passed. `REPORT-T5-027.md` is authoritative evidence.

T5-028 is `DONE - PASS`. It closes the generation-history loop with result inspection available only when a succeeded task has one exact canonical active result lineage match. Missing, mismatched, inactive, malformed, and ambiguous outputs remain honest status-only states. Focused 6/6, full Chromium 201/201, build, desktop/readonly visual, and hygiene gates passed. `REPORT-T5-028.md` is authoritative evidence.

T5-029 is `DONE - PASS`. It turns two or more request-ready selected text/image sources into one canonical image or video generation workflow through a single ordered `insert-graph` command and one undo boundary. Focused 5/5, related 45/45, full Chromium 206/206, build, desktop/compact visual, and hygiene gates passed. `REPORT-T5-029.md` is authoritative evidence.

T5-030 is `DONE - PASS`. It adds a verified T/R intent summary and closes image/video success plus durable failure output validation for workflows created from multi-selection. Focused 4/4, related 27/27, full Chromium 210/210, build, visual, and hygiene gates passed. `REPORT-T5-030.md` is authoritative evidence.

T5-031 is `DONE - PASS`. It prevents repeated generated results from overlapping and makes the latest foreground result visible through a minimal panel-safe viewport translation without changing zoom, selection, or background reconciliation behavior. Focused 10/10, related 47/47, full Chromium 216/216, build, visual, and hygiene gates passed. `REPORT-T5-031.md` is authoritative evidence.

T5-032 is `DONE - PASS`. Canonical image results can create explicit image/video generation branches through one collision-aware atomic command, with exact reference payload, undo/redo, playable output, lineage, reload, invalid-state, readonly, compact, build, visual, and full Chromium 220/220 evidence. `REPORT-T5-032.md` is authoritative evidence.

T5-033 is `DONE - PASS`. Multiple canonical image results now form an explicit source-aware remix selection with independent source counts, ordered image/video requests, full-graph collision-safe placement, extreme-height handling, playable output, reload, invalid-state, compact, readonly, visual, and Chromium evidence. `REPORT-T5-033.md` is authoritative evidence.

T5-034 is `DONE - PASS`. Foreground-created generation workflows use minimum panel-safe camera translation while zoom, selection, inspector, undo/redo, reload, recovery, and background behavior remain stable. `REPORT-T5-034.md` records the classified local performance-gate variance.

T5-035 is `DONE - PASS`. It turns typed port-drag continuation into a discoverable selected-node action while retaining canonical compatibility, collision-aware placement, atomic history, compact drawer handoff, and panel-safe reveal. `REPORT-T5-035.md` is authoritative evidence.

T5-036 is `DONE - PASS`. It separates typed connection compatibility from foreground authoring intent so script and asset sources keep the quiet selected-node continuation action while generation/result nodes avoid misleading or duplicate generic actions. `REPORT-T5-036.md` is authoritative evidence.

T5-037 is `DONE - PASS`. It makes multi-node composition predictable before creation by projecting exact prompt/reference roles and independent input order from the authoritative selection generation command onto selected Canvas sources. `REPORT-T5-037.md` is authoritative evidence.

T5-038 is `DONE - PASS`. It makes expanded repeated results read as one generation-owned version family by projecting canonical active typed outputs as `V1..Vn` whenever their generation node is selected. `REPORT-T5-038.md` is authoritative evidence.

T5-039 is `DONE - PASS`. It completes selected-generation provenance by tracing authoritative T/R inputs through the generation node to every canonical ordered V output with restrained result-edge emphasis. `REPORT-T5-039.md` is authoritative evidence.

T5-040 is `DONE - PASS`. It adds an explicit panel-safe camera action that fits the authoritative T/R-to-generation-to-V trace without automatic movement, graph mutation, or history changes. `REPORT-T5-040.md` is authoritative evidence.

T5-041 is `DONE - PASS`. It extends the same explicit full-lineage fit to any canonical selected result while retaining exact V selection, provenance emphasis, and collision-aware toolbar clearance. `REPORT-T5-041.md` is authoritative evidence.

T5-042 is `DONE - PASS`. It makes authoritative inspector lineage sources directly keyboard-navigable to their exact Canvas nodes across desktop, compact, and readonly review. `REPORT-T5-042.md` is authoritative evidence.

T5-043 is `DONE - PASS`. It aligns image-to-image references with `extra_body.image`, locks exact outbound image payloads at the HTTP boundary, and accepts the official top-level completed-video `url` without removing safe `video_url` compatibility. `REPORT-T5-043.md` is authoritative evidence.

T5-044 is `DONE - PASS`. It scales the detached generation composer as one world-space DOM surface so typography, padding, border, and focus geometry remain proportional from 10% through 800% without low-zoom trace obstruction. `REPORT-T5-044.md` is authoritative evidence.

T5-045 is `DONE - PASS`. It removes the low-zoom status-badge scale floor, preserves the high-zoom cap, and keeps lifecycle labels single-line so dense overview nodes retain proportional status hierarchy. `REPORT-T5-045.md` is authoritative evidence.

T5-046 is `DONE - PASS`. It scales media fallback typography and spacing through a scoped surface zoom contract and removes browser-native failed-media artifacts while preserving native successful image/video rendering. `REPORT-T5-046.md` is authoritative evidence.

T5-047 is `DONE - PASS`. It scales T/R/G/V provenance pills as corner-anchored node annotations below 100%, caps high-zoom growth at 120%, and preserves lineage semantics across desktop, compact, and mobile overview. `REPORT-T5-047.md` is authoritative evidence.

T5-048 is `DONE - PASS`. It turns the current decoded frame of a selected video into a durable project image asset and collision-aware Canvas source node, then proves that frame can participate in ordered image and video multi-node composition. `REPORT-T5-048.md` is authoritative evidence.

T5-049 is `DONE - PASS`. Captured frames expose strict source-video and capture-time provenance, navigate back through responsive review contracts, and support repeated independent captures that compose in stable order. `REPORT-T5-049.md` is authoritative evidence.

T5-050 is `DONE - PASS`. Explicit selection order now drives exact T/R composition roles and persisted input order, while the bounded preflight menu reveals every ordered source identity before mutation. `REPORT-T5-050.md` is authoritative evidence.

T5-051 is `DONE - PASS`. Prompt and reference sources can be reordered independently inside the composition preflight through selection-only controls, then feed exact image/video generation order without graph mutation. `REPORT-T5-051.md` is authoritative evidence.

T5-052 is `DONE - PASS`. A near-limit 10-source composition now keeps summary and generation actions fixed while the ordered queue alone scrolls; keyboard R8 reorder and exact image/video order remain intact at desktop and compact widths. `REPORT-T5-052.md` is authoritative evidence.

T5-053 is `DONE - PASS`. One selected connection now exposes contextual prompt, reference, result, or generic data identity without permanent edge labels. Collision-aware placement, integrated insertion, compact bounds, and passive readonly review preserve the quiet Canvas. `REPORT-T5-053.md` is authoritative evidence.

T5-054 is `DONE - PASS`. Selected generation connections now expose exact authoritative T/R/V order and excluded state, synchronized with provider context, persisted input order, and canonical result lineage across desktop, compact, reload, and readonly review. `REPORT-T5-054.md` is authoritative evidence.

T5-055 is `DONE - PASS`. One selected generation or canonical result can explicitly arrange its exact movable T/R-to-G-to-V family into ordered, real-height-aware columns through one reversible command without moving exclusions or unrelated nodes. `REPORT-T5-055.md` is authoritative evidence.

T5-056 is `DONE - PASS`. A generated result used by a later generation now exposes exact downstream R and canonical upstream G/V identity in the existing Canvas and inspector provenance vocabulary, while provider behavior and invalid-state honesty remain unchanged. `REPORT-T5-056.md` is authoritative evidence.

T5-057 is `DONE - PASS`. It verifies a real two-origin result merge and adds independent inspector navigation from each downstream reference row to its authoritative origin generation without recursive ancestry or provider changes. `REPORT-T5-057.md` is authoritative evidence.

T5-058 is `DONE - PASS`. It proves that two-origin downstream R order can change independently while canonical upstream V identity and origin navigation remain stable through provider execution, undo/redo, reload, compact editing, and readonly review. `REPORT-T5-058.md` is authoritative evidence.

T5-059 is `DONE - PASS`. It verifies two generated-image origins as ordered video keyframes through exact provider input, durable playable result materialization, native playback, canonical lineage, reload, compact preflight, and readonly review. `REPORT-T5-059.md` is authoritative evidence.

T5-060 is `DONE - PASS`. It verifies two-origin video keyframes through provider failure, zero-charge/no-result safety, reload and readonly persistence, and one explicit successful retry while keeping the browser specs maintainable. `REPORT-T5-060.md` is authoritative evidence.

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
