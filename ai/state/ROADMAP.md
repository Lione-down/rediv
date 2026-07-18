# Revid Product V2 / Phase 5 Direct Delivery Roadmap

Last updated: 2026-07-17

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
| 72 | T5-072 | Enterprise Canvas scenario certification and finite release closure | DONE - PASS | T5-071 |
| 73 | T5-073 | Canvas authoring card hierarchy refinement | DONE - PASS | T5-072 |
| 74 | T5-074 | Authenticated logout and global session exit | DONE - PASS | T5-073 |
| 75 | T5-075 | Provider-backed generation parameters and reference intent | DONE - PASS | T5-074 |
| 76 | T5-076 | Runtime generation visibility | DONE - PASS | T5-075 |
| 77 | T5-077 | Durable generation stage and percent progress | DONE - PASS | T5-076 |
| 78 | T5-078 | Pending output placement and result handoff | DONE - PASS | T5-077 |
| 79 | T5-079 | Canvas media containment and keyframe rail isolation | DONE - PASS | T5-078 |
| 80 | T5-080 | Canvas node and connection interaction usability | DONE - PASS | T5-079 |
| 81 | T5-081 | Storyboard projection and image storyboard groups | DONE - PASS | T5-080 |
| 82 | T5-082 | Professional action registry, Slash Palette, and 4/9/16/25 project-image grid split | DONE - PASS | T5-081 |
| 83 | T5-083 | Versioned script-to-shot schema and atomic script/shot/generation/storyboard graph creation | DONE - PASS | T5-082 |
| 84 | T5-084 | Professional Storyboard recipes for grid, character, and scene views | DONE - PASS | T5-083 |
| 85 | T5-085 | Image expansion, inpaint, erase, cutout, upscale, region, and fusion contracts | DONE - PASS | T5-084 |
| 86 | T5-086 | Shot angle, framing, focus, lighting, and time controls | DONE - PASS | T5-085 |
| 87 | T5-087 | Workflow templates, dry-run, dependency execution, cancel/resume, and quota estimate | DONE - PASS | T5-086 |
| 88 | T5-088 | Video trim, concat, preview, export, and FFmpeg/backend contract decision | DONE - PASS | T5-087 |
| 89 | T5-089 | Audio generation and audio-driven video with fail-closed capability/quota/task contracts | DONE - PASS | T5-088 |
| 90 | T5-090 | Revid Agent/Skill interface over native auth, project, canvas, and generation contracts | DONE - PASS | T5-089 |
| 91 | T5-091 | Revid native cinematic Skills, structured references, deterministic generation optimization, billing acknowledgement, and stale lineage | DONE - PASS | T5-090 |

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

T5-061 is `DONE - PASS`. It keeps the Inspector's visible request inputs consistent with the submitted provider snapshot by locking prompt and input-order mutation only while generation is in flight, while preserving lineage navigation and success/failure recovery. `REPORT-T5-061.md` is authoritative evidence.

T5-062 is `DONE - PASS`. It turns selected playable video nodes into a bounded five-frame visual source, with click-to-seek navigation, exact timestamp capture provenance, sampler cancellation, and responsive readonly safety. `REPORT-T5-062.md` is authoritative evidence.

T5-063 is `DONE - PASS`. It keeps contextual selection controls adjacent without covering selected media, video keyframes, the desktop Inspector boundary, or compact drawer overlays. `REPORT-T5-063.md` is authoritative evidence.

T5-064 is `DONE - PASS`. Compose-ready multi-node selections now read as one deliberate generation input set through a passive aggregate hull while individual T/R roles, toolbar behavior, readonly review, and generation semantics remain intact. `REPORT-T5-064.md` is authoritative evidence.

T5-065 is `DONE - PASS`. Two backend-authoritative, single-reference visual asset recipes directly create character sheets or scene multi-view boards while reusing the existing generation transaction and keeping internal recipe prompts out of editable UI. Backend 36 plus 7 subtests, browser 5/5 plus related 51/51, build, skill validation, and five visual states passed.

T5-066 is `DONE - PASS`. Generated-video nodes now preserve canvas-readable playback and frame tools when CORS permits them, fall back exactly once to playback-only for valid no-ACAO media, provide deterministic keyboard controls, and retain explicit bounded failures without a backend proxy. Focused 6/6, related 50/50, build, reload, no-mutation, and three-viewport visual gates passed.

T5-067 is `DONE - PASS`. A canonical generation with multiple outputs now opens the existing mixed-media V1..Vn comparison tray directly, while result-owned current selection, exact connection order, compact/readonly review, and zero graph mutation remain intact. Focused 3/3, related 50/50, build, and three-viewport visual gates passed.

T5-068 is `DONE - PASS`. Comparison tray selection now reuses the existing panel-safe node reveal contract so distant V variants return to the unobscured Canvas area while already-visible variants remain camera-neutral. Focused 2/2, related 19/19, build, visual, and zero graph-mutation gates passed.

T5-069 is `DONE - PASS`. Canvas video nodes and comparison previews share one active playback owner, preventing overlapping motion or audio while preserving native controls, keyboard playback, CORS fallback, frame tools, and zero graph mutation. Focused 2/2, related 30/30, build, and visual gates passed.

T5-070 is `DONE - PASS`. New generation-reference authoring exposes only image sources the provider can consume, while historical unsupported edges remain visible as excluded provenance. Focused 29/29, cross-surface 85/85, build, visual, and zero-unintended-mutation gates passed.

T5-071 is `DONE - PASS` for its offline implementation and browser boundary by explicit Human offline-only closure. Exact recipe versions, v2 prompts, toolbar isolation, responsive ownership, regression, build, and skill validation pass. All 20 authorized Agnes requests returned HTTP 503 with zero outputs, so real-provider visual fidelity remains unverified and must not be claimed.

T5-072 is `DONE - PASS`. Current evidence certifies graph authoring, multi-node image/video workflows, dense ordering, recovery, responsive ownership, accessibility, live 200/300 performance, persistence, and security. The final release decision is PASS with real Agnes visual fidelity retained as an explicit Human-deferred unsupported boundary.

T5-073 is `DONE - PASS`. Script, note, and generation authoring nodes now use one compact Revid-native header/body/status grammar while media/results stay intrinsic and media-first. Focused browser groups, responsive/zoom/editing/recipe/toolbar regressions, build, hygiene, and a fresh guarded live 200-node/300-connection run passed. `REPORT-T5-073.md` is authoritative evidence.

T5-074 is `DONE - PASS`. All authenticated shells now expose one responsive account menu backed by an authenticated logout acknowledgement and immediate failure-safe browser teardown. Backend auth 13/13, frontend regression 12/12, build, keyboard/ARIA, desktop/375px visual, and hygiene gates passed. `REPORT-T5-074.md` is authoritative evidence.

T5-075 is `DONE - PASS`. It adds a backend-owned generation capability/normalization contract, explicit image ratio and video reference/duration intent, typed Canvas preference persistence, and immutable sanitized `generation_tasks.request_parameters` snapshots. It preserves recipe-fixed `4:3`, canonical generation/result lineage, and the no-paid-call/no-runtime-migration boundaries. T5-076 may activate only after this verified scope is committed and pushed.

T5-076 is `DONE - PASS`. It adds task-only polling, local/durable runtime presentation for generation cards and Inspector, reload recovery, graceful poll failure, and targeted renderer updates with zero active-tick graph/history/selection/camera mutation. `REPORT-T5-076.md` is authoritative evidence.

T5-077 is `DONE - PASS`. It adds nullable constrained stage/percent fields, monotonic normalization, truthful provider/persisting/success semantics, and shared card/Inspector/Graph Access presentation without applying the migration to user/runtime data. `REPORT-T5-077.md` is authoritative evidence. T5-078 owns non-persistent pending output placement and exact terminal result handoff; neither Task may fabricate provider progress or persist transient UI artifacts into the Canvas graph.

T5-078 is `DONE - PASS`. One shared collision-aware resolver now predicts local and durable active output reservations and the final canonical result position. The pointer-passive projection has no graph, minimap, Graph Access, event, selection, autosave, or history identity; focused 6/6, functional Chromium 354/354, backend 463 plus 78 subtests, build, visual, hygiene, and fresh 200/300 supervisor gates passed. `REPORT-T5-078.md` is authoritative evidence.

T5-079 is `DONE - PASS`. A rendered containment regression first measured four decoded images outside their owning surfaces, then rail-local placement ownership removed the cross-component scoped-selector leak without changing Canvas geometry or media-first card design. Focused 1/1, related Chromium 23/23, build, visual, blast, and hygiene gates passed. `REPORT-T5-079.md` is authoritative evidence.

T5-080 is `DONE - PASS`. Shared visible geometry, 40 CSS px port acquisition, exact compatible landing, neutral aggregate continuation, group-unit movement, and reduced-motion-safe active-only edge flow passed focused 61/61, functional Chromium 372/372, a 4,855-module build, four-viewport visual review, hygiene, and the guarded live 200-node/300-connection boundary at 59.92 FPS and 16.8ms frame p95. The local software-rendered mock performance variance remains explicitly classified without threshold weakening. `REPORT-T5-080.md` is authoritative evidence.

T5-081 is `DONE - PASS`. Pure Storyboard projection, accessible revision-neutral view switching, exact 2-25 image storyboard groups, shared order/layout, conversion/ungroup, whole-group movement, and fail-closed Canvas duplication passed visual/accessibility 6/6, functional Chromium 392/392, a 4,872-module build, backend 465 tests plus 78 subtests, hygiene, and guarded live 200/300 evidence at 59.94 FPS. `REPORT-T5-081.md` is authoritative evidence.

### T5-082 through T5-090 clean-room professional workflow program

Only one Task in this sequence may be active at a time. The program reproduces publicly observable capabilities and interaction patterns without copying LibTV private source, branding, icons, copy, prompts, or visual assets. Revid's existing graphite-black/violet UI, Leafer Canvas, typed ports, bidirectional connections, reroute, groups, result branching, Storyboard projection, native auth/project/canvas/generation contracts, and responsive boundaries remain authoritative.

T5-082 is `DONE - PASS`. A pure professional action registry, Canvas-owned accessible Slash Palette, and source-preserving 4/9/16/25 split now reuse existing project uploads and one atomic `insert-graph`. Focused 21/21, functional Chromium 412/412, a 4,880-module build, visual/accessibility review, exact history/persistence, and guarded live 200/300 at 59.89 FPS passed. The software-rendered mock FPS variance remains explicitly classified without threshold weakening. `REPORT-T5-082.md` is authoritative evidence.

T5-083 is `DONE - PASS`. Strict backend/frontend shot schema v1, a deterministic authenticated mock-only endpoint, one atomic `2N+1` node / `2N` typed-edge graph, stable shot identity with independent Storyboard order, exact duplication remap, zero-mutation failure/context drift, history/reload, responsive accessibility, backend 474 plus 93 subtests, functional Chromium 428/428, a 4,884-module build, and guarded live 200/300 at 59.89 FPS passed. No automatic/paid generation, database change, or UI redesign was introduced. `REPORT-T5-083.md` is authoritative evidence.

T5-084 is `DONE - PASS`. Six strict Revid-owned version-1 presets now reuse the existing T5-083 mock shot contract, one atomic Storyboard graph command, and the T5-065 visual recipe lifecycle. Exact 4/9/16/25 topology, current project-owned image eligibility, prompt secrecy, failure/retry, Storyboard/history/persistence, responsive accessibility, functional Chromium 443/443, product backend 474 plus 93 subtests, a 4,886-module build, and guarded live 200/300 at 59.87485 FPS passed. No real/paid provider, database change, or UI redesign was introduced. `REPORT-T5-084.md` is authoritative evidence.

T5-085 is `DONE - PASS`. It adds downstream-only image-operation branches, strict source-normalized region/mask/request contracts, and a backward-aware backend capability v2 boundary. Production remains local-region-only with zero provider operations; full provider-operation behavior is mock-verified and no real or paid call is authorized.

T5-086 is `DONE - PASS`. It adds a backward-aware generation capability v3 with strict Revid-owned shot angle, framing, focus, lighting, and time-direction contracts. Production truthfully advertises zero executable controls and rejects crafted requests before task/quota/asset/provider mutation; mock-only evidence proves exact snapshots, drift safety, Context Panel persistence, 375px review-only behavior, and existing Canvas lifecycle preservation. Full backend passed 482 plus 116 subtests, build passed 4,893 modules, full Chromium passed 462/462, and the guarded 200/300 run passed at 56.56 FPS / 16.8ms p95. `REPORT-T5-086.md` is authoritative evidence.

T5-087 is `DONE - PASS`. It adds a Revid-owned v1 Workflow Template/preflight/mock lifecycle for selected active-Canvas image/video generation nodes, with deterministic dependencies, conservative quota-unit estimates, strict fail-closed scope/capability/graph checks, and explicit mock-only cancellation/recovery. Final focused Chromium passed 14/14, build passed 4,900 modules, and final functional Chromium passed 466/466. The independently retained SwiftShader 200/300 mock performance title missed unchanged 55 FPS/33ms thresholds but is transparently classified as an environment-sensitive exception with no Canvas hot-path diff; `REPORT-T5-087.md` is authoritative evidence.

T5-088 is `DONE - PASS`. It adds Revid-owned video-edit preflight v1 for explicit active-Canvas trim/concat source scope, native preview intent, deterministic initial dialog focus/Escape close, and a truthful `backend_export_unavailable` boundary. FFmpeg/FFprobe discovery found local tools but no Revid worker/API/task/output contract, so no execution is claimed or attempted. The fresh post-review build passed 4,907 modules; focused Chromium passed 11/11, related video/Canvas regression passed 54/54, and final functional Chromium passed 471/471 in 8.7 minutes. The independently retained SwiftShader 200/300 mock title measured 50.72477779708455 FPS / 33.400000000001455ms p95 against unchanged limits with no hardware acceleration; its two companion tests passed and it remains transparently classified as an environment-sensitive exception with no Canvas hot-path diff. `REPORT-T5-088.md` is authoritative evidence. T5-089 may activate only after the pushed T5-088 baseline is verified.

T5-089 is `DONE - PASS`. It adds backend capability v4 with exact production-unavailable audio v1 plus backward-aware frontend parsing, strict selected-source preflight, synthetic mock-only contract proof, and an accessible non-mutating Slash Palette panel. Production stops before Canvas/history/autosave, quota, task, asset, or provider mutation; no endpoint, migration, provider call, paid action, or real media processing was added. Focused backend passed 22 tests, focused Chromium passed 21/21, adjacent Chromium regression 71/71, isolated project-asset services 9, repaired Storyboard 15/15, final functional Chromium 466/466, and build 4,914 modules. The independently retained SwiftShader/no-hardware 200/300 title measured 52.001311281480724 FPS / 33.399999999999636ms p95 against unchanged 55/33 limits while its other metrics and companion functional performance/accessibility titles passed; this environment-sensitive exception is classified without threshold weakening in `REPORT-T5-089.md`. The unrelated existing AnyIO upload-security worker import failure remains documented without a production workaround. Any durable provider work remains a Human-gated separate contract. T5-090 may activate only after the scoped T5-089 commit/push is verified.

T5-090 is `DONE - PASS`. Its closed v1 contains exactly one Revid-built `revid.canvas-context` version 1 manifest and models only mock-only/unavailable execution. Existing current-user plus Canvas ownership and current Canvas document lookup scope discovery/preflight; strict bounded source validation returns deterministic id/type/subtype context, while no execute endpoint, provider, quota, task, asset, Canvas, history, autosave, or durable output authority exists. The desktop Palette overlay is accessible and explicit about its mock-only boundary; 375px remains review-only. Backend focused passed 8/8, focused frontend passed 14/14 plus Agent UI 2/2 and Storyboard 15/15, build passed 4,921 modules, final functional Chromium passed 472/472, and an isolated 200/300 title passed at 57.519 FPS / 16.8ms p95 under SwiftShader/no hardware acceleration. The original combined-matrix 49.54 FPS observation is retained in `REPORT-T5-090.md` without threshold change. No arbitrary/imported/remote Skill code executes; T5-091 subsequently reused this exact boundary and is now closed below.

T5-091 is `DONE - PASS`. It extends T5-090 backward-compatibly with exactly three Revid-owned cinematic Skill manifests, structured Canvas-local mentions, deterministic inspectable native text/image/video handoffs, user-owned backend-catalog provider/model selection, server-authoritative billing acknowledgement, strict shot schema v2, duplication-safe references, and non-destructive stale lineage. Full backend passed 512 tests plus 116 subtests, final functional Chromium passed 496/496, production build passed 4,926 modules, focused cinematic Chromium passed 8/8, and the unchanged 200/300 title passed at 56.35185107977278 FPS / 16.8ms p95. Delivery `1f3077c9208a0a7590d1ab549e89210a49d0b923` is pushed; no arbitrary/remote Skill runtime, automatic retry/model routing, paid call, secret access, user/runtime migration, or real-provider fidelity claim was introduced. Report: `ai/reports/REPORT-T5-091.md`.

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
