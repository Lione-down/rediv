# TASK-T5-020 - Direct edge selection and typed endpoint rerouting

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 maintenance
- Dependency: T5-019 `DONE - PASS`
- Owner: Codex Project Lead Engineer

## Objective

Make persisted Canvas edges directly editable without adding permanent graph chrome: select an edge through a forgiving hit area, then drag either selected endpoint to a compatible typed port while preserving the edge identity and one-command history boundary.

## Scope

- Add a wide transparent hit path while keeping the visible edge thin and passive.
- Select an edge from the Canvas and expose two contextual endpoint handles only for that edge.
- Reroute source or target endpoints to compatible opposite-direction ports.
- Update the existing edge ID atomically through a typed reconnect command, one autosave PATCH, and one undo/redo entry.
- Support click-away, Escape, Delete/Backspace, readonly mode, pointer cancellation, invalid targets, zoomed viewports, and branched/convergent graphs.
- Verify interaction, persistence, history, accessibility labeling, visual hierarchy, and regression behavior.

## Non-goals

- Inserting a node into an edge, creating a new node from an edge endpoint, multi-edge selection, changing edge metadata/status, paid generation calls, or replacing the Canvas engine.

## Acceptance criteria

- A forgiving invisible path selects the intended edge without making idle edges visually louder.
- Only the selected edge shows source and target endpoint handles, each with an accessible label.
- Compatible endpoint drop updates the same edge ID in canonical output-to-input orientation.
- Reroute produces one connection upsert, no connection delete/create identity churn, and one undo/redo history entry.
- Empty, incompatible, same-node, duplicate, locked, readonly, outside-Canvas, Escape, and pointer-cancel paths do not mutate the graph.
- Delete/Backspace and Graph Access selection continue to share the existing selected-connection contract.
- Focused browser tests, relevant regression, full Chromium, build, viewport screenshots, UTF-8, file-size, diff, and sensitive-path gates pass.

## Result

Complete. See `ai/reports/REPORT-T5-020.md`.
