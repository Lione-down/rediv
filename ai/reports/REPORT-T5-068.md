# REPORT-T5-068 - Comparison variant panel-safe reveal

## Outcome

T5-068 is `DONE - PASS`.

Choosing a result from the comparison tray now returns creators to the exact persisted V node on Canvas. Distant variants receive the minimum panel-safe camera translation, while already-visible variants remain camera-neutral.

## Implementation

- Reused the existing `CanvasStage.revealNode` contract after comparison selection settles.
- Preserved the current comparison tray, canonical V order, result lineage, and responsive Inspector behavior.
- Added no new camera math, graph layout, component, or persistence boundary.

## Verification

- Focused comparison reveal: PASS, 2/2.
- Related result lineage, foreground result reveal, and workflow reveal: PASS, 19/19.
- Frontend production build: PASS, 4,820 modules transformed.
- Desktop 1440x900 visual evidence: `output/playwright/t5-068-comparison-reveal/distant-v6-revealed-1440x900.png`.

The browser contract moves V6 from `(3200, 1200)` into the unobscured Canvas area with exactly one viewport PATCH, unchanged 100% zoom, exact `V6 / 6` lineage, and zero document PATCH. A separately positioned visible V2 produces no viewport PATCH.

## Product boundary

This closes comparison navigation only. It does not alter result placement, physical stacking, edges, minimap, graph history, generation execution, or provider behavior.
