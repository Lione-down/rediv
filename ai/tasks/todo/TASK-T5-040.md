# TASK-T5-040 - Explicit full generation trace fit

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 maintenance
- Dependency: T5-039 `DONE - PASS`
- Owner: Codex Project Lead Engineer

## Objective

Let users explicitly fit the authoritative `T/R -> generation -> V` trace into the usable Canvas viewport without automatic camera movement or graph mutation.

## Scope

- Add one quiet context-panel action for a selected generation.
- Fit the selected generation, authoritative input sources, and canonical result family as one node set.
- Respect desktop panel and compact drawer viewport boundaries.
- Preserve selection, inspector context, graph history, and readonly review behavior.
- Verify desktop, 920px compact, 375px readonly, no-op, camera persistence, and no-document-mutation states.

## Non-goals

- Automatic camera movement on selection, graph layout changes, node movement, output stacking, graph mutation, backend changes, provider execution, or mobile editing.

## Acceptance criteria

- A selected generation with provenance exposes an accessible `适配完整生成链路` action.
- The action fits its canonical T/R sources, generation node, and V outputs inside the panel-safe viewport.
- Compact drawers close before fitting and preserve the selected generation.
- One effective action performs at most one viewport update and creates no document PATCH or undo-history entry.
- Repeating the action is visually stable; readonly review can use it without enabling editing.
- Build, focused/related Chromium, desktop/compact/readonly visual, file-size, diff, and sensitive-path gates pass.
