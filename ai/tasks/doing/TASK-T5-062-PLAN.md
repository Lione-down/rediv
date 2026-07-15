# TASK-T5-062 Plan

- State: `DONE`
- Updated: 2026-07-15

## Objective

Turn selected playable video nodes into a visual source for downstream image work by exposing a bounded keyframe rail that seeks the video and feeds the existing durable frame-capture flow.

## Reference boundary

- AIGCCanvasFlow proves that a frame strip can connect video review, seeking, and image-node creation in one Canvas-local path.
- Revid will not copy its dense interval presets, emoji labels, VueFlow implementation, browser-only blob nodes, or styling.
- Revid keeps five representative frames, quiet graphite materials, canonical project upload, source-video provenance, collision-aware placement, undo/redo, and responsive readonly rules.

## Scope and acceptance criteria

- A selected, unlocked, editable playable video exposes exactly five representative frame thumbnails after metadata loads.
- Sampling uses a separate media element, never disturbs playback or mutates the graph, and is cancelled when selection or source changes.
- Clicking a thumbnail seeks the visible video to its exact timestamp and marks one active frame without graph or provider mutation.
- The existing `截取当前帧` action captures the selected timestamp as one PNG, uploads it, and creates one durable image node with exact video/time provenance.
- The rail stays within the selected node width, avoids native playback controls, and remains legible at desktop and 920px compact widths.
- Readonly, locked, unselected, unavailable, and broken videos expose no mutable rail.
- Loading and extraction failure are bounded and accessible; at most five thumbnails and one sampler exist per selected video.
- Existing image/video geometry, native playback, keyboard ownership, capture recovery, and provider contracts remain unchanged.

## Non-goals

- Full timeline editing, trim, splice, export, waveform, arbitrary interval settings, background extraction for every video, or automatic multi-frame insertion.
- Database, provider, quota, asset schema, or Canvas engine changes.

## Direction

- Visual thesis: a quiet graphite filmstrip attached to the selected media, with imagery as the anchor and violet reserved for the active playhead.
- Content plan: orient with five representative frames, seek the video, then reuse the existing explicit capture action.
- Interaction thesis: click-to-seek with one stable active marker, no hover-only required action, no modal, and no playback jump during sampling.
- CSS strategy: one scoped component using existing Canvas tokens, fixed thumbnail count, intrinsic 16:9 previews, and a clipped horizontal rail.

## Units

1. Add RED browser coverage for five decoded frames, no preview mutation, exact seeking, capture provenance, compact bounds, and readonly/locked absence.
2. Implement a cancellable five-frame sampler and selected-video rail.
3. Integrate rail selection with the visible native video and existing capture command.
4. Run focused and related Chromium regression, build, visual inspection, hygiene, report, commit, and push.

## Risks

- Sampling on the visible video would cause playback jumps; use a separate detached video element.
- Unbounded extraction could multiply decode and memory cost; sample only one selected video and cap at five small JPEG data URLs.
- A rail below the node can collide with toolbar or neighboring nodes; keep it attached, width-bounded, and verify real desktop/compact layouts.
- Cross-origin media may taint Canvas; fail honestly without changing playback or graph state.
