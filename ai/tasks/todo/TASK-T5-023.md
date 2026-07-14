# TASK-T5-023 - Result lineage and sibling variant inspection

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 maintenance
- Dependency: T5-022 `DONE - PASS`
- Owner: Codex Project Lead Engineer

## Objective

Make generated image and video results traceable and comparable in place. Selecting a canonical result node must reveal its origin generation, the ordered inputs behind that generation, its output edge, and all sibling result variants from the same generation branch.

## Scope

- Add a pure typed lineage resolver for canonical result nodes and active generation/result edges.
- Reuse ordered T/R input provenance and add G plus stable V1/V2/V3 sibling markers.
- Highlight origin-to-result branch edges without changing graph state.
- Show origin generation, current variant position, source task, and source model in the result detail panel when available.
- Reject missing, inactive, unsupported, mismatched, and ambiguous lineage rather than inventing ancestry.
- Verify landscape, square, portrait, playable video, missing media, broken media, branch selection, readonly, zoom, compact viewport, and accessibility labels.

## Non-goals

- Automatic result ranking, visual diff pixels, batch deletion, recursive historical tasks, autoplay, provider calls, backend schema changes, or Canvas engine replacement.

## Acceptance criteria

- Selecting one canonical result reveals one origin generation marker, ordered input provenance, and stable sibling variant markers.
- The selected result's branch edge and sibling edges are distinguishable from input provenance while remaining visually restrained.
- Result detail reports the same variant index and generation source shown on the graph.
- Invalid or ambiguous lineage exposes no misleading markers or fabricated metadata.
- Selecting a non-result node clears result lineage and preserves T5-022 generation provenance.
- Real decoded image and playable video results, unavailable/broken states, 1440px and 375px readonly views, focused/relevant/full Chromium, build, UTF-8, file-size, diff, and sensitive-path gates pass.
