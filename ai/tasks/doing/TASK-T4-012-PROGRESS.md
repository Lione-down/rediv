# T4-012 Progress - Canvas decomposition and persistence

- Task: `T4-012`
- Active delivery: `Unit A - Decomposition And Persistence`
- State: `DOING`
- Updated: 2026-07-12

## Current Bounded Unit

Unit 2 - project-scoped domain foundation. Completed and production-build verified in this run.

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

- Unit 3: implement optimistic create/delete, move debounce/flush, mutation ownership, rollback, and visible error propagation.
- Unit 4: decompose CanvasStage and connect Workspace route lifecycle without visual redesign.
- Unit 5: run focused regression/build plus real refresh and controlled-failure acceptance, then close Unit A.

## Exact Next Action

Implement Unit 3 only: add optimistic node/connection create/delete operations and a per-node debounced move queue to the Canvas store, with ownership-safe rollback and an awaitable `flushPendingMoves()`; surface store save errors through Workspace `NMessage`, then run controlled failure checks and `frontend: npm run build`.

## Files Changed

- `frontend/src/modules/canvas/types.ts` - added Canvas wire DTO, list response, and mutation payload contracts.
- `frontend/src/modules/canvas/api.ts` - added project-scoped authenticated Canvas request functions.
- `frontend/src/modules/canvas/mappers.ts` - added explicit server DTO to client render-model mapping.
- `frontend/src/store/canvas.ts` - replaced fixtures with guarded project load and server-state lifecycle.
- `frontend/src/types/canvas.ts` - added reusable status plus structured node/connection persistence metadata.
- `frontend/src/views/app/Workspace.vue` - normalized and bound route project context to Canvas loading.
- `ai/tasks/doing/TASK-T4-012-PROGRESS.md` - recorded Unit 2 implementation, verification, remaining work, and next action.
- `ai/state/CURRENT.md` - refreshed the rolling T4-012 snapshot for the completed Unit 2 bounded unit.

## Commands And Summarized Results

- Single-flight task-list capability search: unavailable; branch/HEAD/index and Git-operation state were used as the concurrency baseline.
- Required document reads: AGENTS, direct operating model, CURRENT, ROADMAP, active Task, PLAN, PROGRESS, and linked direct-delivery ADR read completely.
- Git baseline commands: clean `main` at `91b000c690b3c36dadb8f7e33567db0608cb892a`; no staged, modified, untracked, unmerged, detached, or in-progress Git-operation state.
- Relevant source reads and `rg` inventory: reviewed Canvas store/types, Workspace, request and module conventions, plus backend node/connection schemas and routes; no backend change was required.
- `frontend: npm run build`: PASS; `vue-tsc -b` and Vite completed with 4,695 modules transformed.
- Fresh scoped diff review and `git diff --check`: PASS; no fixture fallback, whitespace error, backend/global-style change, or secret-bearing path was introduced.

## Blockers And Release Conditions

- No Human gate or dependency blocker exists for Unit 3.
- Task-list single-flight capability was unavailable; release condition for commit is unchanged starting branch/HEAD/index and no Git operation/unmerged path at pre-commit recheck.
- The pre-existing `5b64ca1` Playwright snapshot commit is outside T4-012 ownership and must remain untouched unless the Human Owner separately requests cleanup.
- No push is authorized.
