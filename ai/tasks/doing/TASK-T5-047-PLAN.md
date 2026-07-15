# TASK-T5-047 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Audit findings

- Source and result overlay rectangles already follow exact viewport zoom and receive `--canvas-surface-zoom`.
- Their child pills remain fixed at 22px high with fixed negative offsets.
- At the 15% mobile trace overview, the pills approach the full node height and read as a row of large dots.
- Existing status and media work establishes exact low-zoom scaling with a 120% cap for auxiliary chrome.

## Direction

- Transform the complete pill so typography, padding, radius, and shadow scale as one unit.
- Anchor the pill center to the overlay corner before applying scale.
- Use exact surface zoom below 100% and cap high zoom at 120%.
- Add direct size-ratio and corner-center assertions plus retained viewport screenshots.

## Units

1. Add focused RED coverage for source/result marker scaling and corner anchoring.
2. Implement proportional marker transforms using the existing surface zoom contract.
3. Build and run focused plus related lineage/status/media regressions.
4. Capture and inspect desktop, compact, mobile, and extreme zoom evidence.
5. Synchronize report/state/pitfalls, review hygiene, commit, and push.

## Risks

- Scaling from the current negative offset would make markers drift away from node corners.
- Scaling individual font metrics would leave fixed padding or shadow obstruction.
- Very small overview labels are intentionally topology cues and must not replace accessible inspector semantics.
