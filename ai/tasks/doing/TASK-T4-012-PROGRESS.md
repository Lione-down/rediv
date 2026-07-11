# T4-012 Progress - Canvas decomposition and persistence

- Task: `T4-012`
- Active delivery: `Unit A - Decomposition And Persistence`
- State: `DOING`
- Updated: 2026-07-12

## Current Bounded Unit

Unit 4 - CanvasStage decomposition and Workspace persistence lifecycle. Completed with controlled browser interaction, route-leave flush, and production-build verification in this run.

## Completed Work

- Read the active Task, direct-delivery ADR, CanvasStage, canvas store/types, Workspace route integration, request client, project module conventions, backend node/connection routes and schemas, and their CRUD tests.
- Confirmed `CanvasStage.vue` is 1,071 lines and currently mixes Leafer lifecycle/rendering, viewport transforms, pointer state, connection creation, minimap, overlays, and CSS.
- Confirmed the Pinia Canvas store is global fixture state with four static nodes and three static connections; it has no project identity, load/error state, server DTO mapping, mutation ownership, debounce, flush, or rollback.
- Confirmed Workspace already derives `project_id` from the route query but does not bind that ID to Canvas load/persistence and renders `<CanvasStage />` without project context.
- Confirmed the existing backend contracts are sufficient for Unit A and require no schema or migration change.
- Locked the domain/store/viewport/renderer/interaction/persistence boundaries and five bounded delivery units in `TASK-T4-012-PLAN.md`.
- Explained the starting HEAD difference from automation memory: pre-run commit `5b64ca1` contains only the formerly untracked zero-byte root Playwright snapshot and is already `origin/main`; the current run did not modify or revert it.
- Added typed Canvas node/connection wire DTOs plus scoped node list/create/update/delete and connection list/create/delete request functions under `frontend/src/modules/canvas/`.
- Added explicit DTO-to-render mapping for node type, structured content/title, coordinates, size, status, connection endpoints, ports, metadata, and active state; backend field names do not leak into Canvas render code.
- Replaced all fixture nodes/connections with a project-scoped Canvas store containing `activeProjectId`, loading/error/loaded state, guarded parallel node/connection load, request deduplication, and selection validation.
- Guarded load commits by project generation and local data revision so route/session changes, later loads, or newer local node changes cannot be overwritten by stale responses.
- Bound Workspace to a trimmed scalar `project_id` route value; missing IDs clear old Canvas data, and route changes immediately load the new project without an unhandled watcher rejection.
- Reset and conditionally reload Canvas server state when the authenticated session token changes.
- Added optimistic node/connection create and delete actions with temporary IDs, request ownership, server-ID reconciliation, duplicate-edge suppression, node-delete connection snapshots, and rollback that only applies while the failed request still owns the affected entity.
- Added a per-node 400 ms trailing move queue with confirmed/desired positions, serialized requests, newer-intent protection, same-node flush before delete, and an awaitable `flushPendingMoves()` for the Unit 4 route/unmount lifecycle bridge.
- Preserved negative world-space movement while clamping node-create API coordinates; if the server clamps a newly created node, the queued move reconciles the intended local world position through the update contract.
- Split mutation coordination into `frontend/src/modules/canvas/mutations.ts` and pure persistence helpers into `frontend/src/modules/canvas/persistence.ts`; the Pinia store is now 227 physical lines and the coordinator is 411.
- Routed existing anchor-drag connection creation and pointer-up node movement through persistence actions instead of direct array-only mutations.
- Added `saveError` revisions and a Workspace `NMessage` watcher so mutation failures are visible without producing unhandled promise rejections.
- Added node coordinates to the Canvas scene signature after controlled failure QA exposed that store rollback alone did not redraw the Leafer visual.
- Verified controlled move failure twice from the same original coordinate: each drag emitted exactly one debounced PUT, returned 503, displayed `Controlled move failure`, and restored both store and Leafer position.
- Verified controlled connection failure twice for the same edge: both attempts emitted POST 503 and displayed `Controlled connection failure`, proving the failed optimistic edge did not remain as a ghost or block retry.
- Extracted pure zoom clamping, viewport/world transforms, node anchors, connection paths, viewport bounds, and minimap metrics into `canvas-geometry.ts` with no Vue, Leafer, or HTTP dependency.
- Extracted Leafer creation, resizing, scene rendering, target registration, node visual lookup, and visual-position updates into `canvas-renderer.ts`; the renderer consumes semantic pointer callbacks and contains no persistence calls.
- Extracted pointer drag, anchor connection, pan, zoom, status/minimap overlays, and stage mount/unmount coordination into `use-canvas-stage.ts`; `CanvasStage.vue` is now a 76-line orchestration template instead of a 1,074-line mixed-responsibility component.
- Moved the unchanged scoped Canvas visual rules into `canvas-stage.scss`; no global token or visual language was changed.
- Added `use-canvas-persistence-lifecycle.ts` to await all queued moves before leaving Workspace or updating its project route, and issue an idempotent best-effort flush during unmount.
- Verified a controlled failed drag emitted one PUT 503, displayed `Controlled move failure`, and restored the exact pre-drag minimap style; a failed anchor connection emitted one POST 503, displayed `Controlled connection failure`, and left zero connection paths.
- Verified wheel zoom and middle-button pan both updated the minimap viewport; a successful SPA route leave sent exactly one queued PUT and waited about 188 ms for a deliberately 150 ms response before navigation completed.

## Contract Audit Findings

### Nodes

- List/create/update/delete are project-scoped and authenticated.
- Server DTO fields are `node_type`, `content`, `position_x`, `position_y`, `width`, `height`, and `status`; client render fields need explicit mapping.
- Create rejects negative coordinates; update currently accepts them. Unit A will send clamped create coordinates and preserve world-space drag behavior.
- The `content` object is the compatible place for UI title/text metadata because the backend has no separate title field.

### Connections

- List/create/delete are sufficient for Unit A; update is available but not needed.
- The client must map `source_node_id`, `target_node_id`, and port fields to its render model.
- Backend rejects self-loops, duplicate identical port edges, and cross-project endpoints; directed cycles are allowed.
- Node deletion removes related connections, so the optimistic node-delete snapshot must include connected edges for rollback.

### Async And Persistence Ownership

- Project changes can race two list requests; a generation token must guard load commits.
- Drag updates must remain local during pointermove and enqueue one server update after pointerup.
- A failed older move must not roll back a newer local move; rollback requires per-node operation/version ownership.
- Connections cannot persist against temporary node IDs; dependent creation must wait for server identity reconciliation.
- Route exit needs an awaitable flush path, while unmount can only be a best-effort fallback.

## Remaining Work

- Unit 5 only: run focused backend contract regression plus real local FastAPI/MySQL load, create, move, connection, delete, refresh, and persistence acceptance; repeat the remaining mutation-class failure cases and close Unit A when all gates pass.

## Exact Next Action

Implement Unit 5 only: start the authorized local FastAPI/MySQL runtime without reading secrets, create or select a local user/project fixture through normal APIs, verify real node/connection load plus create/move/delete/refresh persistence and route isolation, run focused backend node/connection tests and the frontend build, then fresh-review and close Unit A only if every non-deferred gate passes.

## Files Changed

- `frontend/src/modules/canvas/types.ts` - added Canvas wire DTO, list response, and mutation payload contracts.
- `frontend/src/modules/canvas/api.ts` - added project-scoped authenticated Canvas request functions.
- `frontend/src/modules/canvas/mappers.ts` - added explicit server DTO to client render-model mapping.
- `frontend/src/modules/canvas/persistence.ts` - added mutation drafts, pending-move state, temporary IDs, error mapping, and create-payload clamping helpers.
- `frontend/src/modules/canvas/mutations.ts` - added optimistic create/delete, ID reconciliation, ownership-safe rollback, connection deduplication, and debounced move/flush coordination.
- `frontend/src/store/canvas.ts` - replaced fixtures with guarded project load and server-state lifecycle.
- `frontend/src/components/canvas/CanvasStage.vue` - persisted pointer-up moves and anchor connections and made coordinate rollback trigger a Leafer redraw.
- `frontend/src/components/canvas/canvas-geometry.ts` - isolated pure viewport/world transforms, node anchors, connection geometry, and minimap calculations.
- `frontend/src/components/canvas/canvas-renderer.ts` - isolated Leafer instance, scene, visual target, resize, and node-position lifecycle.
- `frontend/src/components/canvas/canvas-stage.scss` - preserved CanvasStage scoped visual rules outside the orchestration component.
- `frontend/src/components/canvas/composables/use-canvas-stage.ts` - isolated pointer, pan, zoom, connection draft, overlay, and stage lifecycle coordination.
- `frontend/src/components/canvas/composables/use-canvas-persistence-lifecycle.ts` - added awaited route-leave/project-update and best-effort unmount move flushing.
- `frontend/src/types/canvas.ts` - added reusable status plus structured node/connection persistence metadata.
- `frontend/src/views/app/Workspace.vue` - normalized and bound route project context to Canvas loading.
- `ai/tasks/doing/TASK-T4-012-PROGRESS.md` - recorded Unit 4 implementation, verification, remaining work, and next action.
- `ai/state/CURRENT.md` - refreshed the rolling T4-012 snapshot for the completed Unit 4 bounded unit.

## Commands And Summarized Results

- Single-flight task-list capability search: unavailable; branch/HEAD/index and Git-operation state were used as the concurrency baseline.
- Required document reads: AGENTS, direct operating model, CURRENT, ROADMAP, active Task, PLAN, PROGRESS, and linked direct-delivery ADR read completely.
- Git baseline commands: clean `main` at `a656ccda6a3bf28291d94b639d9ae941185bb51a`; no staged, modified, untracked, unmerged, detached, or in-progress Git-operation state.
- Relevant source reads and `rg` inventory: reviewed Canvas store/types, Workspace, request and module conventions, plus backend node/connection schemas and routes; no backend change was required.
- `frontend: npm run build`: PASS; `vue-tsc -b` and Vite completed with 4,695 modules transformed.
- `frontend: npm run build` after Unit 3 and final coordinator split: PASS; `vue-tsc -b` and Vite completed with 4,697 modules transformed.
- Playwright controlled local-browser failure check at 1280x800 with mocked `/me`, node lists, and connection lists: PASS; final run recorded one PUT 503 for one drag and two POST 503 responses for two identical edge attempts, with visible error messages and retryable rollback state. No backend, secret, database, or paid provider call was made.
- `node --check output/playwright/t4012-controlled-routes.js`: PASS for the ignored browser mock evidence handler.
- File-size check: `canvas.ts` 227 lines, `mutations.ts` 411, `persistence.ts` 60; `CanvasStage.vue` remains 1,074 lines and is the Unit 4 target.
- Fresh scoped diff review and `git diff --check`: PASS; no fixture fallback, whitespace error, backend/global-style change, or secret-bearing path was introduced.
- `frontend: npm run build` after Unit 4 decomposition: PASS; `vue-tsc -b` and Vite completed with 4,701 modules transformed.
- File-size check after Unit 4: `CanvasStage.vue` 76 lines, `canvas-geometry.ts` 125, `canvas-renderer.ts` 179, `use-canvas-stage.ts` 286, persistence lifecycle 19, and scoped SCSS 154; all remain below 500 lines.
- Playwright CLI controlled browser regression at 1280x800 with local mock routes: PASS for two-node project load, exact failed-move visual rollback and visible error, failed-connection ghost removal and visible error, wheel zoom, middle-button pan, and one awaited successful route-leave PUT. Expected mocked 503 browser resource errors were observed; unrelated Home API connection-refused entries occurred only after the route-leave destination loaded without Home mocks.

## Blockers And Release Conditions

- No Human gate or dependency blocker exists for Unit 4.
- Task-list single-flight capability was unavailable; release condition for commit is unchanged starting branch/HEAD/index and no Git operation/unmerged path at pre-commit recheck.
- The pre-existing `5b64ca1` Playwright snapshot commit is outside T4-012 ownership and must remain untouched unless the Human Owner separately requests cleanup.
- No push is authorized.
- Fifteen root `.playwright-cli/page-2026-07-11T16-*.yml` snapshots are untracked browser evidence generated after earlier and current clean baselines. They are excluded from this delivery commit and must not be deleted or staged without a separate cleanup decision.
