# TASK-T5-067 Plan

- State: `DONE - PASS`
- Objective: expose the existing output-variant comparison experience at the canonical generation owner.

## Design thesis

- Visual thesis: a quiet graphite version filmstrip appears only on request; persisted nodes and typed edges remain the graph truth.
- Content plan: generation Inspector reports output count and one comparison action; the tray shows exact V identity and media.
- Interaction thesis: generation opens family review, result selection returns to one exact node, Escape closes without mutation.

## Delivery sequence

1. Add RED tests proving the current generation Inspector lacks the family comparison entry.
2. Project canonical generation variants in `CanvasWorkspace.vue` and pass only the minimal comparison contract to `CanvasContextPanel.vue`.
3. Generalize comparison item/origin selection so generation and result entry share `CanvasResultCompareTray`.
4. Verify mixed media, invalid variants, selected-result handoff, desktop, compact, readonly, keyboard, and zero PATCH.
5. Run related regression, build, screenshots, fresh diff review, documentation, commit, and push.

## Invariants

- Connection order remains V order.
- Generation entry has no arbitrary selected variant; the tray may open with no card marked current.
- Result entry retains its current V marker and existing behavior.
- Compact drawer must finish leaving before the tray becomes interactive.
- Review actions never change graph content, history, viewport persistence, quota, tasks, or assets.
