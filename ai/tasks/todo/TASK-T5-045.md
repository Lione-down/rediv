# TASK-T5-045 - Proportional node status badges at overview zoom

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 Canvas refinement
- Dependency: T5-044 (`DONE - PASS`)
- Owner: Codex Project Lead Engineer

## Objective

Keep running, success, and failure status badges proportional to their Canvas nodes at overview zoom so dense multi-input/result workflows remain readable without wrapped or obstructive status labels.

## Scope

- Remove the low-zoom status badge oversizing while preserving the existing high-zoom cap.
- Verify running generation plus landscape, square, portrait, video, unavailable, and broken result states.
- Verify full-trace fit, explicit zoom limits, desktop, compact desktop, and mobile readonly review.

## Non-goals

- Status copy redesign, new lifecycle states, node geometry changes, result layout changes, backend work, provider calls, or mobile editing.

## Acceptance criteria

- At 44% to 51% trace-fit zoom, each status badge scales with its node and no label wraps solely because the badge is oversized.
- Running, success, and failure badges remain visually distinct through existing icon and color semantics.
- At 100% the current badge size remains unchanged; above 120% it remains capped at the existing maximum.
- At 10% badge geometry remains finite and contained by the node overlay.
- Full-trace fit, result lineage, media controls, toolbar placement, selection, and graph mutation boundaries remain unchanged.
- Browser evidence covers 1440x900, 920x760, and 375x812.

## Visual direction

- Visual thesis: status is a quiet semantic layer attached to the node, not a screen-space banner floating over the graph.
- Content plan: color/icon provides overview signal, label becomes readable as the user zooms in, node media remains the visual anchor.
- Interaction thesis: continuous zoom changes status scale without added motion or lifecycle behavior changes.
