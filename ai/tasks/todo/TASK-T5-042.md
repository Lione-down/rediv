# TASK-T5-042 - Inspector lineage source navigation

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 maintenance
- Dependency: T5-041 `DONE - PASS`
- Owner: Codex Project Lead Engineer

## Objective

Make authoritative generation lineage directly navigable from the inspector so users can move from a generation to its T/R sources or from a result to its origin generation without searching the graph manually.

## Scope

- Turn generation context source rows into accessible locate actions while preserving input reorder controls.
- Turn result lineage's origin generation into an accessible locate action.
- Select and panel-safely reveal the exact canonical target node.
- Keep desktop inspector synchronized to the new selection.
- On compact/readonly, close the current drawer, suppress only the navigation-caused automatic reopen, then reveal the target on Canvas.
- Verify included/excluded sources, result origin, desktop, compact, readonly, keyboard, camera, and no-document-mutation states.

## Non-goals

- Graph mutation, edge traversal beyond displayed authoritative lineage, automatic navigation on selection, breadcrumbs, backend changes, provider execution, or mobile editing.

## Acceptance criteria

- Every displayed T/R source exposes `定位到画布：<title>` and targets its exact source node.
- A canonical result exposes the same action for its origin generation.
- Desktop navigation keeps the inspector open and synchronized to the target.
- Compact/readonly navigation closes the drawer and leaves the target selected and panel-safely visible.
- Ordinary compact selection still opens its context drawer; only the explicit locate path suppresses one reopen.
- Navigation creates at most one viewport PATCH, zero document PATCHes, and no undo-history entry.
- Build, focused/related Chromium, desktop/compact/readonly visual, diff, and sensitive-path gates pass.
