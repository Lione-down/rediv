# TASK-T5-038 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Audit findings

- Collision-safe result placement correctly keeps repeated outputs individually selectable, but expanded nodes share generic titles and do not read as one version family until a result is selected.
- Selected-result lineage already validates and labels sibling variants, while selected-generation provenance currently labels only T/R inputs.
- Physically stacking persisted result nodes would contradict click, edge, minimap, placement, and durable geometry contracts. A semantic output map provides the version-stack reading without graph mutation.

## Direction

- Visual thesis: expanded media stays fully usable, while tiny V markers communicate one generation-owned version family.
- Content plan: T/R markers explain inputs, the generation node is the center, V markers explain outputs, and the comparison tray remains the detailed review surface.
- Interaction thesis: select generation to scan the whole family, select a result to inspect one lineage, open comparison only when detail is needed.
- CSS strategy: reuse existing lineage marker styling and V2 tokens; add no new shell or animation.

## Units

1. Extract canonical ordered result variants for one generation and reuse it inside selected-result lineage.
2. Project output variants from the selected canonical generation in CanvasStage.
3. Extend pure and browser tests across valid, invalid, repeated, responsive, and no-mutation states.
4. Build, run related regressions, and inspect desktop/compact screenshots.
5. Synchronize state, write REPORT, review diff and hygiene, commit, and push.

## Risks

- Reimplementing output filtering in CanvasStage would diverge from selected-result lineage.
- Connection array order is the existing variant-order contract and must not be replaced by position or task timestamps.
- Rendering both generation and result lineage simultaneously could duplicate V markers if selection ownership is not exclusive.
- Result-node physical stacking would create unreachable nodes and is explicitly out of scope.
