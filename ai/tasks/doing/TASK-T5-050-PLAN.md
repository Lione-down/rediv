# TASK-T5-050 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Audit findings

- `selectedNodeIds` already preserves explicit selection sequence.
- `selectedNodes` currently filters the graph array through a Set, silently restoring document order.
- Selection provenance markers and generation commands consume `selectedNodes`, so their order can contradict the user's click sequence.
- The composition menu shows counts and video mode but not the exact ordered source identities.

## Direction

- Make the store's ordered ID list authoritative when projecting node objects.
- Keep one resolver for preview and command semantics.
- Extend the existing composition popover with a bounded ordered list rather than adding a permanent inspector.

## Units

1. Add RED store and composition contracts for reverse selection order.
2. Preserve ordered selected node projection and prove affected command semantics.
3. Render the exact T/R role and title list in the composition menu.
4. Verify desktop, compact, readonly, persisted order, cancellation, and browser visuals.
5. Build, regressions, state/report/pitfalls, diff review, commit, and push.

## Risks

- Selection order also affects two-node connect direction, so regression must prove the now-intentional behavior.
- Long localized titles can overflow the compact menu.
- A separately reconstructed menu list could drift from the command resolver.
