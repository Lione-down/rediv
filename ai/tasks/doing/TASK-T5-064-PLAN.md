# TASK-T5-064 Plan

- State: `DONE`
- Objective: make a multi-node generation selection read as one deliberate composition set without changing graph or generation semantics.

## Scope

- Add one passive screen-space hull around two or more selected sources only when the authoritative selection-generation resolver says they can compose.
- Reuse the same selected-node bounds for hull and contextual-toolbar placement.
- Keep individual T/R role markers as the semantic detail layer and add only a compact aggregate label.
- Verify geometry through pan and zoom, compact drawer ownership, readonly review, and non-composable multi-selection.

## Non-goals

- No group/container persistence or selection behavior changes.
- No provider, database, generation payload, autosave, or command changes.
- No hull for ordinary multi-selection that cannot create a generation workflow.

## Acceptance criteria

- A compose-ready multi-selection exposes one `.selection-composition-hull` that encloses every selected content rect with a stable screen-space gutter.
- The hull is pointer-passive, visually subordinate to media, and labelled with the selected source count.
- Hull geometry follows pan and zoom without mutating the document.
- The hull is absent for single selection, non-composable multi-selection, readonly review, and while the compact context drawer owns the overlay layer.
- Existing T/R ordering, compose actions, toolbar collision avoidance, and selection commands remain unchanged.
- Focused and related Chromium tests, build, visual screenshots, diff hygiene, and documentation reconciliation pass.

## Verification plan

1. Add RED browser assertions for presence, containment, pointer passivity, zoom response, compact ownership, and negative states.
2. Implement shared selection bounds plus the passive hull.
3. Run focused composition and visual specs, then the related selection/toolbar matrix and build.
4. Inspect desktop and compact screenshots before closing documentation.
