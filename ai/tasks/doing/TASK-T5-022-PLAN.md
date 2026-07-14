# TASK-T5-022 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Direction

- Visual thesis: graphite-black media workbench with provenance visible only for the selected generation intent; violet means included and muted graphite means excluded.
- Utility flow: select generation node, read ordered source markers and incoming paths, confirm the same order and exclusion reasons in the context panel, generate.
- Interaction thesis: selection toggles a static spotlight immediately; no looping edge animation or permanent workflow decoration.
- CSS strategy: existing Vue scoped SCSS and Revid tokens only.

## Reference assessment

- AIGCCanvasFlow recursively collects upstream context, but does not expose typed exclusion or request order on the graph.
- ComfyUI keeps execution dependencies legible through socket-to-socket paths.
- Blender Geometry Nodes makes multi-input semantics inspectable through stable socket order.
- Revid will use deterministic order markers and restrained provenance rings while retaining direct typed provider boundaries.

## Units

1. Extend the pure generation-context model with connection identity and deterministic kind order.
2. Add selected-generation source and edge provenance presentation without changing graph mutation state.
3. Align context-panel labels and accessibility text with graph order and exclusion state.
4. Verify convergence, duplicate/limit/missing inputs, payload order, selection clearing, readonly, zoom, compact viewport, and visual evidence.
5. Perform fresh diff review, synchronize durable state, write REPORT, commit, and push.

## Risks

- Independent graph and panel calculations could drift from the provider request order.
- Permanent highlights would make dense graphs noisy and compete with selection/reroute states.
- Excluded inputs could accidentally appear active or be sent to the provider.
- Order markers could scale with world zoom and become unreadable or oversized.
