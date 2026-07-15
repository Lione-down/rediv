# TASK-T5-045 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Audit findings

- Full-trace screenshots at 44% and 51% show status badges at a forced minimum 88% scale while nodes are less than 52% scale.
- Portrait success labels wrap to two lines, and running/failure badges consume disproportionate node area.
- `statusBadgeStyle` is the single shared source for running, success, and warning badge placement and scale.

## Direction

- Use exact viewport zoom below 100%, preserving proportional placement and content scale.
- Retain the existing 120% maximum so high zoom does not create oversized screen-space chrome.
- Keep copy, icon, color, DOM structure, status semantics, and node geometry unchanged.
- Add direct browser assertions for badge-to-node ratios and label wrapping across status types.

## Units

1. Add focused RED coverage for low/normal/high zoom badge geometry and dense trace labels.
2. Correct the shared status badge scale contract.
3. Build and run focused plus related lineage/media/status regressions.
4. Capture and inspect desktop, compact, mobile, and extreme zoom evidence.
5. Synchronize report/state/pitfalls, review hygiene, commit, and push.

## Risks

- A low-zoom minimum keeps text nominally legible but recreates graph obstruction.
- Removing the high-zoom cap would turn status into dominant chrome at 800%.
- Tests must compare badge and node geometry rather than only checking that text exists.
- Video native controls and failure labels must remain unobstructed in dense result columns.
