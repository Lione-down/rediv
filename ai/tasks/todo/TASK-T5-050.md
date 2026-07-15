# TASK-T5-050 - Selection-order composition preflight

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 Canvas refinement
- Dependency: T5-049 (`DONE - PASS`)
- Owner: Codex Project Lead Engineer

## Objective

Make the user's multi-selection sequence the authoritative prompt/reference composition order, and expose that exact order before creating an image or video generation workflow.

## Scope

- Preserve `selectedNodeIds` order when resolving selected node objects.
- Derive T/R roles, generation commands, connection input order, and menu preview from that same order.
- Show exact ordered source titles in the existing composition menu without adding permanent Canvas chrome.
- Verify reverse-order clicks, mixed text/image/result inputs, persisted generation order, desktop and compact presentation, and readonly boundaries.

## Non-goals

- Drag reorder inside the preflight menu, changes to persisted generation reorder, new backend/provider contracts, mobile editing, or automatic graph execution.

## Acceptance criteria

- Selecting B then A resolves `[B, A]`, not document order `[A, B]`.
- Text and reference groups retain independent selection-relative `T1..Tn` and `R1..Rn` order.
- The composition menu lists every included node with its exact role and title before execution.
- The created generation's connection metadata and resolved provider context exactly match the preview.
- Reopening the menu, cancelling it, or using readonly review creates no graph mutation.
- Desktop and 920px compact menus remain legible, keyboard accessible, and in bounds; 375px readonly exposes no composition mutation.

## Visual direction

- Visual thesis: keep the graphite-black Canvas quiet and reveal source identity only inside the requested composition preflight.
- Content plan: summary first, ordered T/R source list second, image/video actions last.
- Interaction thesis: one existing toolbar action opens a deterministic review surface; Escape closes it without changing selection or graph state.
