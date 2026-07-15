# REPORT-T5-031 - Generation result placement and reveal

- Result: `DONE - PASS`
- Date: 2026-07-15
- Baseline: `345a0f87bad4d12322971942a3188ddc32c274e9`

## Outcome

Repeated generation outputs no longer overlap at one coordinate. They occupy deterministic collision-aware slots to the right of their generation node, and the latest foreground result is revealed with the smallest panel-safe viewport translation while zoom, generation selection, and inspector context remain stable.

## Implementation

- Pure reveal geometry computes a no-op, minimum translation, or centered oversized-object translation without changing zoom.
- Result materialization uses persisted graph bounds to find the first unoccupied vertical slot and keeps one canonical source edge per result.
- Foreground result identity is emitted only after the initiating request has reconciled its canonical node. Background polling, Canvas switching, reload, and readonly review do not emit camera intent.
- Desktop panels rely on the stage size already reduced by layout; the 920px overlay drawer contributes its own right inset.
- The shared fixture now supports repeat task/asset identities and the real `{x,y,zoom}` viewport PATCH contract.

## Verification

- Build: PASS, 4,800 modules; repeated after final architecture review.
- Focused T5-031 Chromium: PASS, 10/10; repeated after final architecture review.
- Related generation, reconciliation, autosave, lineage, and arrangement Chromium: PASS, 47/47.
- Full Chromium: PASS, 216/216.
- Visual: PASS at 1440x900; retained evidence is `output/playwright/t5-031-result-reveal/two-visible-result-variants-1440x900.png`.
- Hygiene: `git diff --check` PASS; changed product/test files remain below 500 lines; no modules-to-components dependency remains.

## Boundaries

Evidence is mock-browser lifecycle evidence. No paid provider call, real secret, backend mutation, database operation, camera animation, or mobile editing change occurred.
