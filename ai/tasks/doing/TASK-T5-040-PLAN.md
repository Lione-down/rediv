# TASK-T5-040 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Audit findings

- T5-039 exposes the full authoritative provenance, but its retained 1440px evidence still clips source and result nodes when the inspector is open.
- Existing view controls already own `fitNodes`; Stage separately owns panel-safe reveal behavior and the canonical provenance projection.
- Compact continuation already proves the correct drawer handoff pattern: close the overlay, retain selection, then act after the leave transition.

## Direction

- Visual thesis: the action is a quiet camera utility, not a new primary workflow or graph state.
- Interaction thesis: camera movement is always explicit; selection and inspector remain authoritative.
- Placement: a compact icon action in the context header beside existing node-level controls.
- Styling: reuse existing context-header button treatment and V2 tokens; no new accent treatment.

## Units

1. Extend canonical viewport fit geometry to support usable-area insets and expose fitting an explicit node set.
2. Resolve the selected generation trace in Stage and expose one fit method.
3. Wire a context action through desktop and post-drawer-leave compact flows.
4. Add geometry and Chromium coverage for fit, mutation, history, readonly, and repeat-action boundaries.
5. Build, inspect screenshots, synchronize state/report, review hygiene, commit, and push.

## Risks

- Fitting before the compact drawer leaves would use stale/obstructed dimensions.
- Closing context through the ordinary path would clear selection before Stage resolves the trace.
- A second camera update or focus side effect could create noisy persistence or reopen UI.
- Extremely wide traces must clamp zoom without placing nodes behind route chrome or controls.
