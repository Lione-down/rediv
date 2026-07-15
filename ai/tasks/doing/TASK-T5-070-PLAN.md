# TASK-T5-070 Plan

- State: `DONE - PASS`
- Objective: make typed Canvas authoring advertise only generation references the current request boundary can consume.

## Design thesis

- Visual thesis: keep graphite nodes and latent ports quiet; unsupported actions disappear instead of gaining warning chrome.
- Content plan: valid image sources retain image/video continuation; historical unsupported edges remain legible as excluded provenance.
- Interaction thesis: chooser, drag, reroute, insertion, and multi-select composition share one semantic gate.

## Delivery sequence

1. Add RED tests proving video/audio/text/generation outputs currently advertise generation-media compatibility.
2. Add a semantic authoring-port resolver without weakening structural persisted-edge reading.
3. Route every graph authoring surface through the shared resolver.
4. Verify valid image references, legacy excluded edges, multi-image order, responsive behavior, build, screenshots, diff, documentation, commit, and push.

## Invariants

- Persisted old edges are never deleted or hidden by this Task.
- Provider context remains authoritative and image-only.
- One source/target pair produces the same answer across all authoring surfaces.
- No second connection type system or UI warning layer is introduced.
