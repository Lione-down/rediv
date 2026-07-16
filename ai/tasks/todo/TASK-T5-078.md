# TASK-T5-078 - Pending output reservation and exact result handoff

- State: `DONE - PASS`
- Objective: make each separate result card spatially predictable by showing a non-persistent output reservation immediately and materializing the canonical result at that exact collision-aware location after durable success.

## Scope

- Extract the existing result subtype geometry and collision-aware slot calculation into one pure resolver shared by pending projection and final materialization.
- Project local active requests before task discovery and strict project/Canvas/source-linked durable queued/running tasks after discovery or reload.
- Deduplicate local and durable identity, allocate stable non-overlapping virtual slots for concurrent tasks, and recompute against current real Canvas bounds.
- Render a pointer-passive world-space image/video reservation with the authoritative stage/percentage and existing semantic tokens.
- Remove the projection and insert the existing canonical one-node/one-edge result at the same resolved coordinates in one reconciliation turn.
- Preserve selection, Inspector, V order, lineage, comparison, branching, panel-safe reveal, one undo boundary, readonly/reduced-motion behavior, and zero runtime graph mutation.

## Non-goals

- No persisted ghost node, graph/minimap/Graph Access identity, port, hit target, keyboard stop, context-menu target, selection affordance, autosave/history entry, camera pan, new polling owner, backend/schema/provider change, paid call, or real secret access.
- No generation-node-to-media mutation and no change to the canonical generation-to-result model.

## Acceptance criteria

- Pure tests cover image/video geometry, repeated tasks, occupied/extreme-height bounds, missing sources, terminal exclusion, deterministic ordering, and exact shared placement.
- Local submit shows immediately; durable discovery/reload replaces or reconstructs it without duplicates; multiple active tasks retain stable non-overlapping slots.
- Pending stage/percentage matches the existing authoritative runtime presentation and does not introduce another fetch/poll loop.
- Success creates exactly one canonical result and source edge at the predicted slot; failure/timeout creates neither and removes the reservation.
- Pending projection adds zero graph PATCH/history/quota/asset/result mutation, minimap/Graph Access node, hit target, port, selection, or keyboard ownership.
- Focused, related, full browser, build, visual, supervisor performance, file-size, UTF-8, diff, and sensitive-path gates pass.

## Visual direction

- Visual thesis: quiet graphite result-shaped reservation, existing violet/warning/success roles, and no decorative glow or shimmer.
- Content plan: media identity, authoritative stage, truthful optional percentage; no controls or explanatory card chrome.
- Interaction thesis: pointer-passive, static under reduced motion, no camera movement until canonical result materializes, and no visual jump at handoff.

## Boundaries

- T5-075, T5-076, and T5-077 contracts remain unchanged and authoritative.
- User-owned `.hermes` plans and `output/` evidence remain excluded from staging.
