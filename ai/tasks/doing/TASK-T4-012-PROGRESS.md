# T4-012 Progress - Canvas decomposition and persistence

- Task: `T4-012`
- Active delivery: `Unit A - Decomposition And Persistence`
- State: `DOING`
- Updated: 2026-07-12

## Current Bounded Unit

Unit 1 - contract audit and implementation map. Completed in this run without business-code edits.

## Completed Work

- Read the active Task, direct-delivery ADR, CanvasStage, canvas store/types, Workspace route integration, request client, project module conventions, backend node/connection routes and schemas, and their CRUD tests.
- Confirmed `CanvasStage.vue` is 1,071 lines and currently mixes Leafer lifecycle/rendering, viewport transforms, pointer state, connection creation, minimap, overlays, and CSS.
- Confirmed the Pinia Canvas store is global fixture state with four static nodes and three static connections; it has no project identity, load/error state, server DTO mapping, mutation ownership, debounce, flush, or rollback.
- Confirmed Workspace already derives `project_id` from the route query but does not bind that ID to Canvas load/persistence and renders `<CanvasStage />` without project context.
- Confirmed the existing backend contracts are sufficient for Unit A and require no schema or migration change.
- Locked the domain/store/viewport/renderer/interaction/persistence boundaries and five bounded delivery units in `TASK-T4-012-PLAN.md`.
- Explained the starting HEAD difference from automation memory: pre-run commit `5b64ca1` contains only the formerly untracked zero-byte root Playwright snapshot and is already `origin/main`; the current run did not modify or revert it.

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

- Unit 2: implement project-scoped Canvas DTO/API mapping and guarded server load in the Pinia store.
- Unit 3: implement optimistic create/delete, move debounce/flush, mutation ownership, rollback, and visible error propagation.
- Unit 4: decompose CanvasStage and connect Workspace route lifecycle without visual redesign.
- Unit 5: run focused regression/build plus real refresh and controlled-failure acceptance, then close Unit A.

## Exact Next Action

Implement Unit 2 only: add `frontend/src/modules/canvas/` DTO/API mapping and replace fixture initialization in `frontend/src/store/canvas.ts` with a generation-guarded `loadProject(projectId)` state path; update Workspace only enough to bind the normalized route project ID, then run `frontend: npm run build`.

## Files Changed

- `ai/tasks/doing/TASK-T4-012-PLAN.md` - created Unit A design, boundaries, risks, units, and acceptance matrix.
- `ai/tasks/doing/TASK-T4-012-PROGRESS.md` - created audit evidence, remaining work, and exact next action.
- `ai/state/CURRENT.md` - advanced T4-012 Unit A to `DOING` and replaced stale next-action/worktree details.
- `ai/state/ROADMAP.md` - advanced T4-012 Unit A to `DOING`.

## Commands And Summarized Results

- Codex task-list query for the controller title: capability did not return and was terminated after the bounded wait; branch/HEAD/index drift checks are therefore mandatory before staging and commit.
- Required document reads: AGENTS, direct operating model, CURRENT, ROADMAP, active Task, and linked direct-delivery ADR read completely.
- Git baseline commands: clean `main` at `5b64ca13398651aaea3c29d0d095efa0bdc6e1b3`; no staged, modified, untracked, or unmerged paths.
- `git log`, `git reflog`, and `git show HEAD`: explained the memory cursor difference as pre-run commit `5b64ca1`; no current-run Git mutation or in-progress operation was present.
- Relevant `rg` inventory and complete source reads: audited CanvasStage, store/types, Workspace, project/request conventions, backend APIs/schemas, and focused backend tests.
- CanvasStage line count: 1,071 lines; Unit A target remains at most 500.
- Frontend test inventory: no frontend test runner or test files are configured; production type/build and controlled browser/API evidence remain required.

## Blockers And Release Conditions

- No Human gate or dependency blocker exists for Unit 2.
- Task-list single-flight capability was unavailable; release condition for commit is unchanged starting branch/HEAD/index and no Git operation/unmerged path at pre-commit recheck.
- The pre-existing `5b64ca1` Playwright snapshot commit is outside T4-012 ownership and must remain untouched unless the Human Owner separately requests cleanup.
- No push is authorized.
