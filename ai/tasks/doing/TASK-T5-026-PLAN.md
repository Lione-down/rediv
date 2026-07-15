# TASK-T5-026 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Direction

- Visual thesis: quiet reorder controls inside the graphite-black input ledger, visible by intent rather than permanent chrome.
- Content hierarchy: T/R marker, source identity and state, then one-step up/down actions.
- Interaction thesis: one atomic step updates provenance and preflight immediately; undo/redo restores exact order; no drag animation.
- CSS strategy: existing Vue scoped SCSS and Revid tokens only.

## Reference assessment

- ComfyUI derives execution meaning from explicit graph relationships.
- Runway makes ordered media sequence inspectable before generation.
- Figma layer reordering uses reversible one-step commands with disabled boundaries.
- Revid persists order on generation edges and keeps prompt/media groups independent.

## Units

1. Add validated reorder command and atomic connection-metadata mutation.
2. Sort generation context by persisted order with legacy array-order fallback.
3. Add accessible inspector controls and workspace dispatch.
4. Verify prompt/media reorder, provider payload, autosave, reload, undo/redo, invalid commands, compact, readonly, and screenshots.
5. Run full gates, synchronize state, write REPORT, commit, and push.

## Risks

- Array order is not a durable entity field, so metadata must be authoritative after first reorder.
- Reordering media can intentionally change which duplicate or over-limit references enter the provider request.
- Multiple per-edge mutations would violate atomic history and autosave expectations.
- Old graphs must retain their exact existing order until users explicitly reorder.
