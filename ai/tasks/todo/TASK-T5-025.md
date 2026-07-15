# TASK-T5-025 - Multi-input generation request preflight

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 maintenance
- Dependency: T5-024 `DONE - PASS`
- Owner: Codex Project Lead Engineer

## Objective

Make the exact request assembled from a generation node and its connected script/image nodes inspectable before generation, including deterministic prompt composition, media order, video keyframe semantics, and excluded inputs.

## Scope

- Add an accessible, collapsible request preflight inside generation context details.
- Display the exact bounded final prompt from `ResolvedGenerationContext`.
- Display included media in request order with image-generation reference or video reference/keyframe semantics.
- Keep excluded empty, missing, unsupported, duplicate, and over-limit inputs visible with their existing reasons.
- Support editable desktop, compact drawer, and 375px readonly review without mutation.

## Non-goals

- Prompt rewriting, token estimation, provider calls, media ranking, drag reordering, backend changes, autoplay, or Canvas engine changes.

## Acceptance criteria

- Multi-script prompt preview exactly matches the provider request body.
- Included media labels follow request order and distinguish image reference, one-image video reference, and multi-image video keyframes.
- Excluded inputs remain visibly separate and never receive request order.
- Preflight open/close emits no document PATCH, provider request, or selection change.
- Desktop, compact, readonly 375px, long bilingual prompt, focused/relevant/full Chromium, build, visual, UTF-8, file-size, diff, and sensitive-path gates pass.
