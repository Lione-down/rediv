# TASK-T5-022 - Generation input provenance spotlight and deterministic ordering

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 maintenance
- Dependency: T5-021 `DONE - PASS`
- Owner: Codex Project Lead Engineer

## Objective

Make multi-node generation visually auditable on the Canvas. When a generation node is selected, users must be able to see which direct typed inputs participate, their deterministic prompt/reference order, and which connected media inputs are excluded before generation.

## Scope

- Extend resolved generation context with stable connection identity, kind, order, and inclusion state.
- Spotlight participating incoming edges and source nodes only while their generation node is selected.
- Show compact text/reference order markers using existing Canvas geometry and tokens.
- Distinguish excluded missing, unsupported, duplicate, and over-limit media without adding permanent graph noise.
- Keep the context panel and actual provider request order derived from the same resolver.
- Verify mixed text/image convergence, duplicate and limit states, selection changes, readonly mode, zoom, compact viewport, request payload, and accessibility semantics.

## Non-goals

- Recursive indirect context, drag reordering, provider calls, new node types, backend schema changes, animated execution traces, or Canvas engine replacement.

## Acceptance criteria

- Selecting a generation node with connected context marks every direct input source and incoming edge with a stable kind-specific order.
- Included inputs use the restrained active treatment; excluded media inputs remain visible but do not look active.
- The panel labels, graph order, and request `prompt`/`image_ids` order agree.
- Selecting another node or clearing selection removes all provenance chrome.
- Readonly review can inspect provenance without exposing mutation controls.
- Focused, relevant, full Chromium, build, retained screenshots, UTF-8, file-size, diff, and sensitive-path gates pass.
