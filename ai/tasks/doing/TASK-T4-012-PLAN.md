# T4-012 Plan - Canvas decomposition and persistence

- Task: `T4-012`
- Active delivery: `Unit B - Advanced Interaction And Visual Acceptance` (`DOING`)
- State: `DOING`
- Owner: Codex Project Lead Engineer
- Created: 2026-07-12

## Objective

Complete the remaining Canvas interaction contract on top of frozen Unit A persistence: multi-selection and marquee selection, keyboard semantics, context actions, double-click creation, connection/minimap behavior, and responsive browser acceptance. Preserve the existing backend contract and keep every coordinate-sensitive interaction correct from 25% through 200% zoom.

## Scope

Allowed changes:

- `frontend/src/components/canvas/CanvasStage.vue`
- Canvas-local components and composables under `frontend/src/components/canvas/`
- Canvas domain API/types under `frontend/src/modules/canvas/`
- `frontend/src/store/canvas.ts` and `frontend/src/types/canvas.ts`
- project integration in `frontend/src/views/app/Workspace.vue`

Non-goals for Unit B:

- no backend route, schema, model, migration, or database contract changes;
- no Auth, Home, Space, global design-token, or unrelated visual changes;
- no second canvas engine;
- no reopening or redesign of Unit A persistence, backend contracts, or mutation ownership without new failure evidence;
- no global visual redesign, second canvas engine, generation workflow change, or unrelated page work;
- no paid provider call or destructive fixture cleanup.

## Dependencies And Locked Contracts

- T4-007, T4-010, and T4-011 are complete.
- Reuse the authenticated request client in `frontend/src/api/request.ts`.
- Node API: `GET/POST /projects/{project_id}/nodes`, `PUT/DELETE /projects/{project_id}/nodes/{node_id}`.
- Connection API: `GET/POST /projects/{project_id}/connections`, `DELETE /projects/{project_id}/connections/{connection_id}`.
- Node server fields map to client fields as `node_type -> type`, `position_x/position_y -> x/y`; title and display text remain structured inside the existing `content` object.
- Connection server fields map as `source_node_id/target_node_id -> from/to`; Unit A uses the existing logical ports `out` and `in`.
- The backend rejects self-loops, duplicate identical port edges, cross-project nodes, and unauthorized project access. Deleting a node cascades its related connections.
- Node create coordinates must be non-negative. Drag persistence must clamp server-bound coordinates without changing viewport math.

## Delivery Units

### Unit B1 - Selection And Keyboard Foundation - complete 2026-07-12

- Add an explicit ordered multi-selection model while retaining one primary selected node for the existing Inspector and generation controls.
- Support click replacement, Ctrl/Cmd/Shift toggle, and empty-stage marquee replacement/addition using world-space rectangle intersection.
- Render a DOM selection marquee and selected-node visuals without coupling persistence state to transient pointer state.
- Support `Escape` to cancel an active interaction or clear selection, and `Delete`/`Backspace` to delete selected nodes only when focus is not in an editable control.
- Delete multiple nodes through the existing ownership-safe mutation contract; avoid duplicate cascaded connection work and keep failures retryable.
- Verify focused geometry semantics, keyboard editable-target guards, production build, and controlled browser behavior at representative zoom/pan values.

Result: PASS. Ordered multi-selection, click/toggle/marquee semantics, editable-safe keyboard delete, Escape cancellation, selection rollback ownership, selected Canvas/minimap visuals, and no-op click persistence suppression passed controlled browser verification at default and 50% zoom with pan.

### Unit B2 - Context Actions And Double-click Creation

- Add the scoped `NDropdown` context menu for node/stage actions and double-click node creation in world coordinates.
- Reuse existing optimistic create/delete actions and visible mutation errors; do not duplicate persistence logic in the component.

### Unit B3 - Connection, Minimap, And Responsive Acceptance

- Complete connection hit/selection behavior and minimap navigation/viewport checks across 25%-200% zoom.
- Run real browser interaction and layout acceptance at 1440x900, 920x900, and 375x900; close remaining Task criteria and write REPORT only when all gates pass.

### Unit A completion - PASS 2026-07-12

- Real local FastAPI/MySQL and browser evidence covered project-scoped load, store/API create, pointer move, connection create, connection and node delete, cascade behavior, refresh recovery, and A/B route isolation.
- Controlled 503 responses covered create/move/delete node and create/delete connection rollback with visible `NMessage` errors; the final delete-node check also proved selection restoration without overwriting a newer selection.
- Focused backend Canvas CRUD regression passed 19/19, the final production build passed with 4,701 transformed modules, and `CanvasStage.vue` is 89 lines.
- Unit A is frozen. Unit B must not reopen the backend contract unless new evidence is routed through an explicit follow-up decision.

### Unit 1 - Contract audit and implementation map - complete 2026-07-12

- Audit CanvasStage, canvas store/types, Workspace route ownership, request conventions, node/connection schemas, and backend tests.
- Freeze the client/server mapping, async ownership model, rollback boundaries, and decomposition target before business-code edits.
- Produce PLAN and PROGRESS and move T4-012 Unit A to `DOING`.

### Unit 2 - Project-scoped domain foundation

- Add Canvas API functions and server DTOs under `frontend/src/modules/canvas/`.
- Replace static initial Canvas data with a project-scoped Pinia store that tracks load generation, loading/error state, and the active project.
- Load nodes and connections together for the current route project; discard stale responses after project/session changes and never let loading overwrite a newer mutation.
- Preserve selected-node and viewport UI state only where it still references the active project data.
- Add explicit mapping helpers so backend DTOs do not leak into render and interaction code.
- Verify with `npm run build` and focused type/build checks.

### Unit 3 - Optimistic mutation and move queue

- Implement create/delete node and create/delete connection mutations with optimistic state, request deduplication where needed, and per-operation rollback snapshots.
- Queue node position updates through a trailing debounce; a newer move supersedes only that node's older queued position.
- Flush pending moves before route leave/unmount and before destructive mutation of the same node.
- Surface load/save failures through store error state and `NMessage`; rollback only when the failed request still owns the optimistic state.
- Verify failure semantics with controlled request failures and a production build.

### Unit 4 - CanvasStage decomposition and Workspace integration

- Extract pure viewport/world transforms and geometry from render and persistence.
- Extract Leafer node rendering/lifecycle and pointer interaction into Canvas-local modules/composables with explicit callbacks.
- Keep `CanvasStage.vue` as the orchestration shell and reduce it to at most 500 lines.
- Drive load/flush from the normalized Workspace route `project_id`; render a clear missing-project/load/error state and prevent fixture fallback from overwriting server data.
- Preserve the current visual language and existing pan/zoom/anchor-drag behavior.

### Unit 5 - Unit A real acceptance and freeze - complete 2026-07-12

- Run focused backend contract tests and the frontend production build.
- With an authorized local user/project and local FastAPI/MySQL runtime, verify server load, create, move debounce, connection create, delete cascade, refresh recovery, and stale-route protection.
- Force non-paid API failures for each optimistic mutation class and verify visible error plus exact rollback with no ghost node/connection.
- Fresh-review the full Unit A diff for scope, secrets, error paths, async races, and acceptance criteria.
- Record evidence in PROGRESS. Unit B may begin only after all Unit A gates pass.

## Architecture Boundaries

- Domain API/types: wire contracts and request functions only.
- Pinia store: project-scoped server cache, mutation ownership, load generations, rollback, and pending-move coordination.
- Persistence composable: component lifecycle/route flush bridge and user-facing error notification; no rendering.
- Viewport/geometry module: deterministic coordinate transforms, anchors, bounds, and paths; no Vue or HTTP state.
- Leafer renderer: render lifecycle and visual lookup; no HTTP calls.
- Interaction composable: pointer state and semantic callbacks (`select`, `move`, `connect`, `pan`); no wire DTO knowledge.
- `CanvasStage.vue`: compose the above and own only stage DOM plus minimal overlays.
- `Workspace.vue`: normalize route project context and start/stop project binding; generation behavior remains out of scope except where it consumes the same selected node.

## Acceptance Matrix

| Gate | Evidence required |
|---|---|
| Project-driven load | Real project node/connection lists populate the Canvas; stale project responses cannot replace the active project |
| Persistence | Create/move/connect/delete survives refresh and matches backend lists |
| Debounce and flush | Drag emits no request per pointermove; final position is persisted on idle and route exit |
| Rollback | Controlled API failures restore the owned prior state and show a visible error |
| Decomposition | `CanvasStage.vue` is at most 500 lines; new files have single responsibilities |
| Compatibility | Existing pan/zoom and anchor connection behavior remains usable; no backend contract change |
| Build | `frontend: npm run build` passes |

## Risks And Mitigations

- Stale async responses: tag loads and mutations with project/session generations and ignore superseded completions.
- Rollback clobbering newer intent: rollback only if the failed operation still owns the affected entity/version.
- Temporary IDs leaking into server edges: await or reconcile node creation before permitting dependent connection persistence.
- Drag request storms: mutate local coordinates during pointermove and enqueue one trailing update on pointerup.
- Route exit losing the last move: expose an idempotent flush and await it from route leave when navigation permits; unmount performs a best-effort flush fallback.
- Server rejects negative create positions: clamp only API-bound create coordinates while retaining unrestricted viewport pan.
- Existing zero-test frontend setup: use deterministic pure helpers where practical, production type/build checks, backend contract regression, controlled request failures, and real browser/API evidence.

## Completion Rule

Unit A is complete only when every Unit A acceptance gate has fresh evidence, all required state documents agree, the scoped diff is committed, and no non-deferred blocker remains. Unit B work must not begin in the same bounded unit that closes Unit A.
