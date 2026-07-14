# TASK-T5-021 - Atomic typed node insertion into an existing edge

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 maintenance
- Dependency: T5-020 `DONE - PASS`
- Owner: Codex Project Lead Engineer

## Objective

Let users insert a compatible canonical node into a selected persisted edge without manually deleting and rebuilding graph topology. The insertion must preserve the original edge identity for the upstream segment and commit the node plus both resulting segments atomically.

## Scope

- Add one midpoint insertion affordance only on the selected editable edge.
- Resolve canonical subtype options compatible with both the existing source output and target input.
- Place the inserted node around the edge midpoint with viewport-aware menu positioning.
- Preserve the original edge ID for source-to-inserted, create one new inserted-to-target edge, and preserve original metadata/status semantics where valid.
- Commit one node plus two edge upserts through one command, one autosave PATCH, and one undo/redo entry.
- Support keyboard chooser navigation, Escape, outside dismissal, readonly mode, viewport clamping, reduced motion, and branched/convergent graphs.
- Verify text, media, result, incompatible, duplicate, cancellation, history, persistence, topology, and visual scenarios.

## Non-goals

- Dragging arbitrary nodes onto edges, batch insertion across multiple edges, inserting compatibility/legacy node types, provider calls, edge metadata editing, or replacing the Canvas engine.

## Acceptance criteria

- Only a selected editable edge exposes a compact midpoint plus affordance.
- The chooser lists only canonical subtypes that accept the current source port and can feed the current target port.
- Edges with no valid bridge subtype expose no misleading insertion affordance.
- Selection inserts one node and replaces one edge with two correctly typed edges atomically.
- The original edge ID remains on the upstream segment; one new edge ID is created for the downstream segment.
- Autosave emits one node upsert and two connection upserts in one PATCH, with no original-edge delete.
- Undo/redo restores the exact original edge and replays the exact inserted graph.
- Escape, outside click, readonly mode, missing endpoints, locked/unsupported nodes, and invalid options do not mutate the graph.
- Focused browser tests, relevant regression, full Chromium, build, viewport screenshots, UTF-8, file-size, diff, and sensitive-path gates pass.
