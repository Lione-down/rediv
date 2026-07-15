# TASK-T5-048 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Reference findings

- AIGCCanvasFlow demonstrates that video review becomes more useful when a frame can become a downstream image node.
- Its persistent dense frame strip does not fit Revid's restrained world-space node system or current mobile boundary.
- Revid already owns stronger durable primitives: project asset upload, collision-aware insertion, atomic commands, autosave, lineage, and ordered multi-input generation.

## Direction

- Adapt the creative loop, not the reference component: one selected-video current-frame action feeds existing Revid contracts.
- Keep capture inside the media component where the decoded `HTMLVideoElement` is authoritative.
- Keep upload, scoped mutation, placement, selection, and persistence in the resource experience/store layer.
- Represent the frame as a normal image asset node with explicit capture provenance, never as a fake generated result.

## Units

1. Add pure command coverage for frame-asset provenance and collision-aware placement.
2. Add browser RED coverage for action eligibility, PNG upload, insertion, undo/reload, readonly, and failures.
3. Implement decoded-frame capture and scoped upload/insertion flow.
4. Prove captured-frame participation in image and video multi-node composition.
5. Build, run focused and related regressions, inspect evidence, synchronize state/report/pitfalls, commit, and push.

## Risks

- Cross-origin video frames require anonymous CORS before resource loading; setting it after load is too late.
- A successful upload followed by stale canvas context must not mutate the wrong document.
- Inserting a frame as a result node would corrupt generation lineage semantics.
- Permanent capture chrome would obstruct low-zoom overview and native video controls.
- Browser seek and canvas encoding are asynchronous and need explicit ready-state/error handling.
