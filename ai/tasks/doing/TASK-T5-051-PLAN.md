# TASK-T5-051 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Audit findings

- T5-050 exposes exact selection order but provides no way to correct it without closing the menu and reselecting nodes.
- T and R input orders are independent in generation connection metadata.
- `canvasStore.setSelection` can update ordered selection state without document mutation.
- The current preflight list has enough semantic identity to host bounded reorder controls.

## Direction

- Implement one pure swap resolver driven by authoritative selection intent.
- Swap global selection positions of adjacent same-kind inputs so the other input kind remains stable.
- Keep controls within the existing menu and emit selection-only changes through CanvasStage.

## Units

1. Add RED pure contracts for T/R independent movement and boundaries.
2. Implement selection-order swap resolver.
3. Add accessible menu controls and CanvasStage selection handoff.
4. Verify mixed input reorder, image/video creation, compact, readonly, cancellation, and no document mutation.
5. Build, related regression, visual review, report/state/pitfalls, diff review, commit, and push.

## Risks

- Reconstructing roles after a move can drift from generation command semantics.
- Swapping adjacent array items rather than adjacent same-kind inputs can accidentally alter the other group.
- Extra controls can make the compact menu noisy or overflow localized titles.
