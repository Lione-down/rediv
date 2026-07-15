# TASK-T5-033 - Multi-result remix composition

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 maintenance
- Dependency: T5-032 `DONE - PASS`
- Owner: Codex Project Lead Engineer

## Objective

Turn multiple canonical image results into an explicit, understandable remix input set that can create image or video generation without overlap, hidden substitutions, or ambiguous source labeling.

## Scope

- Distinguish generated results from ordinary image assets in multi-selection intent.
- Keep total prompt/image counts and video mode derived from the canonical generation resolver.
- Place selection-created generation nodes in the first deterministic unoccupied right-side slot across the full graph.
- Prove two image results plus text through image and video request payloads, ordered references, undo/redo, reload, result lineage, and playable media.
- Reject video/text/missing-asset/locked/grouped/unsupported and readonly remix states.
- Verify desktop and 920px compact menu geometry and copy.

## Non-goals

- Automatic provider execution, video-as-reference, backend changes, destructive source replacement, cross-Canvas remix, or mobile editing.

## Acceptance criteria

- The compose menu reports prompt, ordinary reference image, and generated-result counts without double counting.
- Two valid image results are described as ordered keyframes for video generation.
- One atomic command creates a generation node plus all ordered typed edges in one undo boundary.
- Placement avoids selected and unrelated persisted graph bounds deterministically.
- Image/video requests contain exactly the selected result asset IDs in stable order.
- Successful generation preserves task, quota, asset, result, edge, history, lineage, playable media, and reload identity.
- Invalid and readonly selections expose no remix mutation.
- Build, focused/related/full Chromium, visual, UTF-8, file-size, diff, and sensitive-path gates pass.
