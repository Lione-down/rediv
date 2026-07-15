# TASK-T5-055 - Arrange authoritative generation lineage

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 Canvas refinement
- Dependency: T5-054 (`DONE - PASS`)
- Owner: Codex Project Lead Engineer

## Objective

Let a creator explicitly turn one selected generation family into a readable left-to-right `T/R -> G -> V` layout without manually multi-selecting every related node.

## Scope

- Resolve the exact active generation family from the same context and lineage sources used by provider preflight and result inspection.
- Expose one contextual arrange action for a selected generation or canonical result.
- Arrange only eligible nodes in the authoritative family through one existing command/history boundary.
- Keep prompt and reference inputs in authoritative order and result variants in canonical `V1..Vn` order.
- Preserve unrelated nodes, current selection, inspector context, viewport, reload, undo/redo, compact behavior, and readonly safety.

## Non-goals

- Background automatic layout, global graph arrangement, edge routing replacement, moving locked/grouped/unsupported nodes, changing input order metadata, or persistent edge labels.

## Acceptance criteria

- A selected generation and any canonical selected result resolve the same exact family node IDs.
- The explicit action arranges participating `T/R` inputs in the left column, generation `G` in the middle, and canonical `V` outputs in the right column.
- Vertical order follows authoritative T then R request order on the left and V variant order on the right.
- Excluded inputs are not silently moved as participating request inputs.
- One action emits one atomic document PATCH and one undo entry; undo and redo restore exact coordinates.
- Unrelated nodes, selection, inspector, input metadata, provider context, and viewport remain unchanged.
- The action is unavailable when a safe coherent arrange cannot be produced and absent in readonly review.
- 1440px, 920px, and 375px readonly states remain bounded and keyboard accessible.

## Visual direction

- Visual thesis: quiet graphite creator shell with one explicit left-to-right lineage rhythm.
- Content plan: ordered T/R column, one G anchor, ordered V column, no decorative labels or permanent overlays.
- Interaction thesis: one contextual icon action with existing press scale and focus treatment; movement is explicit, deterministic, and reversible.
