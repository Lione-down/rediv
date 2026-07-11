# T4-012 Progress - Canvas decomposition and persistence

- Task: `T4-012`
- Active delivery: `Unit B - Advanced Interaction And Visual Acceptance` (`READY`, implementation not started)
- State: `DOING`
- Updated: 2026-07-12

## Current Bounded Unit

Unit 5 - Unit A real acceptance and freeze. Completed with focused regression, real FastAPI/MySQL/API/browser persistence evidence, all mutation rollback classes, deep self-review, and production-build verification.

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
- Started the existing local runtime without reading secrets and verified `/health` against MySQL with `connected=true`, `ready=true`, and Alembic current/head `e9f1a2b3c4d5`.
- Verified real API persistence across two isolated projects: initial node totals 2/1, exact move `(333.5, 444.25)`, refresh-style re-fetch with 2 nodes/1 connection, explicit connection delete, recreated connection plus node-delete cascade, and final 1 node/0 connections.
- Verified the real frontend store against MySQL: create returned a server ID and survived refresh; connection delete survived refresh; connection recreate returned a server ID; node delete survived refresh; final Project A remained 2 nodes/1 connection with no load/save error.
- Verified real Canvas pointer movement and anchor connection persistence across reload, plus Project A/B route isolation and refresh recovery at 2 nodes/1 connection versus 1 node/0 connections.
- Forced controlled 503 failures for create node, move node, delete node, create connection, and delete connection; every class displayed a visible `NMessage` error and restored the owned entity/edge state without temporary ghosts.
- Fixed delete-node rollback so the prior selection is restored only while selection remains empty; a newer selection made during the request remains authoritative.
- Fixed temporary node/connection races found during deep review by stabilizing a creating node's server ID before deletion and repeatedly settling all related connection creates before snapshots. A delayed real connection POST plus failed node DELETE restored only server IDs; a temp node plus two concurrent temp edges then deleted successfully with all four promises fulfilled and clean refresh state.
- Added explicit missing/loading/error/empty Canvas states and a retry action. Controlled browser checks verified missing-project copy, forced loading copy, a visible controlled load error, successful retry, and return to the real graph.
- Split coordinate changes from the Leafer structural scene signature so pointer movement uses targeted visual-position updates instead of clearing and rebuilding the full scene on every reactive coordinate change.
- Completed deep security/architecture/adversarial review. Route encoding, bearer use, backend ownership guards, scope, secrets, and module boundaries passed after the fixes; generation status/content persistence remains an explicit pre-existing generation-scope follow-up, and the lack of a tracked frontend test runner remains a documented structural risk mitigated by deterministic browser/API evidence in Unit A.

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

- Unit A: none; every non-deferred Unit A gate is complete and frozen.
- T4-012 Unit B remains: plan and implement advanced connection interaction, double-click create, selection box/multi-select, context menu, minimap/keyboard behavior, and 1440x900/920px/375px visual acceptance without reopening the backend contract.

## Exact Next Action

Next run, refresh this PLAN and PROGRESS for Unit B before business-code edits, then select only the first bounded advanced-interaction unit; do not reopen Unit A backend contracts without new evidence.

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
- `frontend/src/modules/canvas/mutations.ts` - restored selection on owned delete rollback, stabilized temp-node server identity, and repeatedly settled related temporary connection creates before node-delete snapshots.
- `frontend/src/components/canvas/composables/use-canvas-stage.ts` - added explicit Canvas state notices and separated coordinate updates from structural scene rebuilds.
- `frontend/src/components/canvas/CanvasStage.vue` - rendered accessible missing/loading/error/empty Canvas states with retry.
- `frontend/src/components/canvas/canvas-stage.scss` - styled the scoped Canvas state overlay and retry focus state.
- `ai/tasks/todo/TASK-T4-012.md` - marked the four Unit A acceptance items complete while leaving Unit B criteria open.
- `ai/tasks/doing/TASK-T4-012-PLAN.md` - froze Unit A as PASS and marked Unit B ready but not started.
- `ai/state/ROADMAP.md` - marked T4-012 Unit A `DONE - PASS`; Unit B remains TODO.
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
- Current run Git baseline: `main` at `918d0e0aaa3f5f27a01f030b3b373c60278a110d`; no staged, modified, unmerged, detached, or in-progress Git-operation state; 15 documented root Playwright YAML snapshots were the only untracked paths.
- Single-flight task-list check: PASS; only the current controller was active and all older same-title runs were idle or not loaded.
- `backend: python -m unittest tests.test_canvas_node_crud tests.test_canvas_connection_crud`: PASS, 19/19 tests.
- `frontend: npm run build` before and after the final fixes: PASS; `vue-tsc -b` and Vite completed with 4,701 transformed modules.
- Real local `/health`: PASS on MySQL; database connected/ready and Alembic current matched head at `e9f1a2b3c4d5`.
- Real API/MySQL acceptance: PASS for normal mock auth, two project fixtures, create/move/connect/delete/cascade/re-fetch and exact route isolation; no paid provider call or secret read occurred.
- Real Playwright/frontend acceptance: PASS for server load, store create/delete/recreate, pointer move, anchor connection, refresh persistence, A/B route isolation, explicit Canvas state notices/retry, and all five controlled mutation failure classes.
- In-flight race regression: PASS; delayed real connection create plus failed node delete produced only server IDs, exact graph/selection rollback, successful edge cleanup, and clean refresh state.
- Temp-identity adversarial regression: PASS; one delayed temp node, two related temp edges started across the delete wait, and the delete all fulfilled; store and refresh retained only the original 2 nodes/1 server edge with no temporary ID.
- Deep review and adversarial pass over `git diff 5b64ca1`: PASS after fixing load-state UI, pointermove full-scene rebuild, selection rollback, and temporary-edge reconciliation; generation-state persistence was confirmed out of Unit A scope and no secret/auth/backend-contract drift was found.
- Final file sizes: `CanvasStage.vue` 89, `canvas-geometry.ts` 125, `canvas-renderer.ts` 179, `canvas-stage.scss` 193, `use-canvas-stage.ts` 317, persistence lifecycle 19, `mutations.ts` 434, and `canvas.ts` 227 lines.
- `git diff --check`: PASS.

## Blockers And Release Conditions

- No Human gate or dependency blocker exists for Unit A closure or Unit B planning.
- Commit release condition is unchanged starting branch/HEAD/index, no Git operation/unmerged path, precise owned staging, staged secret scan, and clean staged diff review.
- The pre-existing `5b64ca1` Playwright snapshot commit is outside T4-012 ownership and must remain untouched unless the Human Owner separately requests cleanup.
- No push is authorized.
- Fifteen root `.playwright-cli/page-2026-07-11T16-*.yml` snapshots are untracked browser evidence generated after earlier and current clean baselines. They are excluded from this delivery commit and must not be deleted or staged without a separate cleanup decision.
- Ignored `output/playwright/` contains current local browser screenshots/logs and remains excluded. Two normal local mock users, two projects, three final nodes, and one final connection remain in MySQL as non-production Unit 5 fixture evidence; broad cleanup was not authorized.
