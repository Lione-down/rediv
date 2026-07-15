# TASK-T5-044 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Audit findings

- Full lineage screenshots at 44% and 51% show composer text clipped and overlapping the generation/result area.
- `surfaceNodeRectStyle` scales the composer rectangle's width and height but leaves its DOM typography and spacing at 100%.
- The correct world-space geometry is already defined by `canvasNodeWorldRect`; the missing contract is scaling the complete DOM surface around its top-left origin.

## Direction

- Return unscaled composer world dimensions plus a viewport zoom transform.
- Keep its projected top-left position and final screen-space footprint identical.
- Leave media surfaces and other screen-space overlays unchanged.
- Add focused browser assertions for transform, visual bounds, editing, fit, compact, and mobile behavior.

## Units

1. Add a focused regression that exposes the low-zoom typography/frame mismatch.
2. Correct composer surface geometry at the shared presentation boundary.
3. Build and run focused plus related Canvas regressions.
4. Capture and inspect desktop, compact, mobile, and zoom-boundary evidence.
5. Synchronize report/state/pitfalls, review hygiene, commit, and push.

## Risks

- Applying transform after already scaling dimensions would double-scale the surface.
- A transform without top-left origin would shift the composer away from its node.
- Toolbar collision geometry must continue using the final projected composer bounds.
- Extreme zoom can expose browser layout or focus-outline artifacts even when numeric geometry is correct.
