# Revid V2 Canvas First-Acceptance Specification

- Status: Approved target
- Date: 2026-07-12
- Milestone: Product V2 / Phase 5 Canvas acceptance
- Scope owner: Codex Project Lead Engineer

## 1. Acceptance Boundary

This document is the pass or fail contract for the first V2 milestone. It covers MySQL-backed multi-canvas data, the full-screen dark-purple Canvas, graph editing, persistence, history, performance, browser behavior, accessibility, and evidence classification.

Canvas acceptance does not certify the later visual upgrade of Login, Home, Space, or Admin. Those pages may adopt foundation tokens earlier, but their product-level redesign starts only after this milestone passes.

## 2. Test Personas And Viewports

| Context | Viewport | Capability |
|---|---:|---|
| Primary desktop | 1440x900 | Full editing and generation controls |
| Compact desktop | 1366x768 | Full editing with compact chrome |
| Narrow workspace | 920x900 | Editing with drawers and reduced panel occupancy |
| Mobile review | 375x812 | Browse, inspect, comment-ready review surface; no edit, delete, or generation actions |

Primary browser is current stable Chromium on Windows. The performance report must record Windows version, Chrome version, CPU, memory, GPU, device scale factor, and whether hardware acceleration is enabled.

## 3. Multi-Canvas Acceptance

- [ ] Creating a project atomically creates `画布 1`.
- [ ] A project always has at least one active canvas.
- [ ] The user can create, rename, reorder, switch, and duplicate canvases.
- [ ] Reordering submits the full active-canvas ID order with `base_order_revision`, commits atomically, normalizes `sort_order` to a dense sequence, and persists after refresh and backend restart.
- [ ] A stale reorder revision returns HTTP 409 without a partial order change; a request with missing, duplicate, foreign, or archived canvas IDs is rejected.
- [ ] Duplicate canvas creates new graph IDs and correctly remaps group parents and connection endpoints.
- [ ] Canvas names may repeat; identity comes from the canvas ID.
- [ ] Switching canvas flushes pending graph saves before navigation.
- [ ] A failed flush prevents silent navigation loss and presents retry plus preserve-local-copy actions.
- [ ] Nodes, connections, groups, viewport, undo/redo, and edit revisions remain isolated by canvas.
- [ ] Project assets, generation tasks, and generated assets remain available from every canvas.
- [ ] The database rejects a connection whose endpoints belong to different canvases.
- [ ] Browser refresh and backend restart reopen the exact graph and viewport of the selected canvas.

## 4. Infinite Canvas Acceptance

- [ ] Canvas occupies the workspace viewport and is not constrained to a centered column.
- [ ] Both positive and negative world coordinates can be created, saved, and restored.
- [ ] Zoom range is 10% to 800%, with direct numeric entry and 25%, 50%, 100%, 200%, 400%, and 800% presets.
- [ ] Zoom anchors to the pointer or viewport center as appropriate and does not drift after repeated cycles.
- [ ] `Ctrl+0` fits the graph, and fit-selection is available for a multi-selection.
- [ ] Space plus drag and middle-button drag pan the Canvas.
- [ ] The user can show or hide the minimap, edges, and grid snap independently.
- [ ] Grid uses dots or micro-crosses on the visible Canvas layer and remains visible at accepted zoom levels.
- [ ] Auto-arrange produces a stable, non-overlapping layout and enters undo history as one command.
- [ ] A canvas with no graph shows compact workflow starters while preserving a clear blank-canvas path.

## 5. Selection And Editing Acceptance

- [ ] Single click selects one node.
- [ ] modifier click adds or removes nodes from selection.
- [ ] marquee selects all intersecting nodes and supports additive selection.
- [ ] dragging any selected node moves the entire selection as one command.
- [ ] `Ctrl+D` duplicates selected nodes and internal connections.
- [ ] `Ctrl+G` groups selected nodes; `Ctrl+Shift+G` ungroups them.
- [ ] Delete removes selected nodes or connections only when Canvas focus owns the shortcut.
- [ ] Backspace does not navigate the browser and does not delete while a text input is active.
- [ ] `Ctrl+L` connects a valid two-node selection and reports an invalid selection without mutation.
- [ ] duplicate edges and invalid port combinations are rejected with a specific message.
- [ ] selected connections have a keyboard-reachable hit target and can be deleted.
- [ ] align, distribute, lock, and unlock commands work on valid selections.
- [ ] pointermove never sends an API request; one move command is persisted after pointerup.
- [ ] every mutation can be replayed and inverted through one command interface.

## 6. Shortcut Contract

| Action | Shortcut |
|---|---|
| Add node menu | `Tab` |
| Duplicate | `Ctrl+D` |
| Group | `Ctrl+G` |
| Ungroup | `Ctrl+Shift+G` |
| Connect two selected nodes | `Ctrl+L` |
| Undo | `Ctrl+Z` |
| Redo | `Ctrl+Shift+Z` |
| Delete selection | `Delete` |
| Pan | Hold `Space` and drag |
| Fit graph | `Ctrl+0` |
| Zoom | `Ctrl++` and `Ctrl+-` |
| Auto-arrange | `Alt+Shift+F` |

All shortcuts are documented in an accessible shortcut panel. Canvas-specific shortcuts run only while the Canvas owns focus and must not intercept form fields, dialogs, browser shortcuts, or assistive technology navigation.

## 7. Node Registry Acceptance

| Node type | First-acceptance behavior |
|---|---|
| Script | Editable structured text or prompt; can feed generation nodes |
| Note | Non-generating annotation with no quota action |
| Asset | References a project image, video, or audio asset |
| Generation | Stores model, prompt inputs, status, and task reference |
| Result | References a generated project asset and its originating task |
| Group | Owns visual children and group operations |

- [ ] registry defines type, subtype, ports, default size, icon, capabilities, and serialization version in one place;
- [ ] unknown future node types render a safe unsupported state without corrupting the graph;
- [ ] image and video results use real media previews or labeled placeholders, not invented illustrations;
- [ ] audio is an asset subtype; audio generation is outside this milestone;
- [ ] generation success and failure persist through backend restart;
- [ ] quota changes come from the backend response and are not manually invented by the client;
- [ ] default automated tests use provider mocks; real paid smoke requires explicit Human Owner authorization.

## 8. Persistence, Conflict, And History Acceptance

- [ ] graph load returns canvas metadata, nodes, connections, and current revision as one consistent document.
- [ ] client mutations include `base_revision` and an idempotent `client_mutation_id`.
- [ ] one MySQL transaction resolves an existing `client_mutation_id` before base-revision validation, then applies each new graph mutation, writes the revision, and advances the head.
- [ ] stale base revisions return HTTP 409 with the current revision and do not overwrite server state.
- [ ] a retried `client_mutation_id` returns the original result without duplicate writes.
- [ ] reusing a `client_mutation_id` with a different request fingerprint returns HTTP 409 and never applies the second payload.
- [ ] local undo/redo retains at least 100 commands for the active canvas.
- [ ] durable history retains the latest 50 edit revisions per canvas plus retained checkpoints required by restore.
- [ ] restore creates a new head revision; it never rewrites or deletes previous history.
- [ ] normal autosave enters `Saving` immediately and `Saved` within 1 second after the final interaction.
- [ ] offline or server failure keeps unsaved commands locally and shows `Error` until retry succeeds.
- [ ] switching or closing with unsaved work provides a deterministic flush, retry, or preserve-local-copy path.
- [ ] viewport save is debounced separately and does not advance graph revision.

## 9. Visual Acceptance

- [ ] Canvas is graphite-black with a violet tint; no light panel or white node card remains.
- [ ] one violet family owns selection, focus, primary action, active navigation, and generation emphasis.
- [ ] success, warning, and error retain distinct green, amber, and red icon/text semantics on dark-purple containers.
- [ ] project and canvas identity appear in a compact top-left cluster.
- [ ] the bottom-center tool dock is contextual and does not cover selected nodes at supported viewports.
- [ ] bottom-left view controls contain asset manager, arrange, minimap, edge, grid, and zoom controls.
- [ ] asset manager is optional, resizable, and collapsible.
- [ ] inspector appears only for node, edge, group, or multi-selection context; there is no permanent empty right panel.
- [ ] node content or generation editor appears contextually rather than as a permanent prompt dock.
- [ ] surface depth uses luminance steps and low-opacity borders; no default glass blur, cyan accent, purple-to-blue gradient, or dark drop-shadow stack is used.
- [ ] media and generated results are the strongest visual anchors.

The exact target tokens and component states are defined in `ui/REVID-V2-DESIGN-SYSTEM.md`.

## 10. Performance Acceptance

The seeded acceptance graph contains exactly 200 nodes and 300 connections with a representative mix of node types and media placeholders.

- [ ] local MySQL document load and first stable render complete within 3 seconds.
- [ ] a scripted 30-second pan, zoom, single drag, and multi-drag profile averages at least 55 FPS.
- [ ] p95 frame interval is at most 33 ms.
- [ ] pointer feedback p95 is at most 50 ms.
- [ ] no interaction long task reaches 200 ms.
- [ ] minimap update frequency is capped and does not dominate the main frame budget.
- [ ] viewport movement changes a world transform and does not clear and rebuild all nodes.
- [ ] node create, update, delete, selection, and status changes update keyed visuals incrementally.
- [ ] twenty repeated canvas switches do not duplicate event listeners or show linearly growing retained heap.
- [ ] save, close, reopen, and graph checksum match at 200 nodes and 300 connections.

## 11. Accessibility Acceptance

- [ ] document language is `zh-CN`.
- [ ] icon-only controls expose an accurate `aria-label`, tooltip, and at least a 40x40 px hit target.
- [ ] Canvas focus, selected node, selected connection, save status, and conflict state are perceivable without color alone.
- [ ] Leafer visuals have a synchronized DOM accessibility list for focus, selection, locate, inspect, and allowed delete actions.
- [ ] focus indicators reach at least 3:1 contrast against adjacent surfaces.
- [ ] body text reaches WCAG AA contrast.
- [ ] `prefers-reduced-motion` removes dash, pulse, spin, staged reveal, and press-scale motion without removing state meaning.
- [ ] keyboard-only operation covers canvas switch, node locate, selection, connection review, history, and panel controls.
- [ ] 200% browser zoom preserves access to every control and does not hide critical Chinese labels.
- [ ] the mobile review surface exposes no edit, delete, or generation control.

## 12. Failure And Security Acceptance

- [ ] missing MySQL configuration, wrong dialect, unreachable database, missing Alembic table, and revision mismatch fail closed.
- [ ] no SQLite or in-memory production fallback exists.
- [ ] authentication and project ownership are checked before every canvas and graph operation.
- [ ] the database prevents cross-project and cross-canvas graph references.
- [ ] unexpected node schema versions fail safely and preserve the server document.
- [ ] API, provider, and save failures use specific active-voice messages with retry guidance.
- [ ] logs and evidence never expose credentials, authorization headers, full credential URLs, or local secret values.
- [ ] hard-coded credential candidates are reported only by redacted path, line, and fingerprint.
- [ ] no destructive user-database operation or local `.db` deletion runs without Human Owner authorization.

## 13. Evidence Matrix

| Evidence class | Required proof |
|---|---|
| Unit | geometry, transforms, command inversion, registry, queue, conflict reducer |
| Mock integration | graph document API, provider success/failure, quota semantics |
| Real MySQL integration | migrations, comments, constraints, transactions, revision conflicts, restart persistence |
| Browser | full workflows and viewport matrix in Chromium |
| Visual regression | approved screenshots with deterministic data at all four viewports |
| Performance | recorded environment plus seeded 200/300 trace and summarized metrics |
| Accessibility | automated axe checks plus keyboard-only manual checklist |
| Security | tracked/staged secret scan, database identity guard, unauthorized-access tests |

Mock evidence must never be presented as real MySQL, paid provider, or production evidence.

## 14. Final Pass Condition

Canvas first acceptance is `PASS` only when every non-deferred checkbox above has reproducible evidence, backend full regression and frontend build pass, MySQL current revision equals Alembic head, browser and performance evidence is retained in ignored output, `git diff --check` passes, staged files contain no sensitive artifact, and CURRENT, ROADMAP, Task, PROGRESS, REPORT, and milestone review agree.
