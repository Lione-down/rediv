# TASK-T5-032 - Branch generation from image result

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 maintenance
- Dependency: T5-031 `DONE - PASS`
- Owner: Codex Project Lead Engineer

## Objective

Turn a canonical generated image from a visual endpoint into a reusable workflow input by letting users create an image or video generation branch directly from result details, with explicit graph lineage and no implicit provider execution.

## Scope

- Add one quiet contextual “continue from this result” action for reference-ready image results.
- Offer image-generation and video-generation branch intents.
- Atomically create one generation node and one typed result-to-media edge with durable input order.
- Select the created generation and reuse the existing inspector, prompt, preflight, quota, request, history, and result lifecycle.
- Avoid occupied graph bounds when placing the branch node.
- Verify result-to-video-to-result and result-to-image graph chains, exact payload identity, undo/redo, reload, lineage, and playable media.
- Hide the action for video/text/missing-asset/unsupported results and readonly review.

## Non-goals

- Automatic provider execution, backend changes, video-as-reference support, destructive replacement of the source result, multi-result batch branching, or mobile editing.

## Acceptance criteria

- Eligible image results expose one accessible low-noise branch control with image and video choices.
- One choice emits one atomic generation-plus-edge command and one undo boundary.
- The edge is canonical `result.out -> generation.media` with `input_order: 1`.
- The resulting generation preflight and provider request contain exactly the source result asset ID.
- Successful image/video execution preserves task, asset, result edge, lineage, media, history, quota, and reload identity.
- Invalid and readonly result states expose no branch mutation.
- Desktop and 920px compact layouts remain bounded and keyboard accessible.
- Build, focused/related/full Chromium, visual, UTF-8, file-size, diff, and sensitive-path gates pass.
