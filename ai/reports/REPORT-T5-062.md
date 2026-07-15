# REPORT-T5-062 - Selected video keyframe rail

- Result: `DONE - PASS`
- Date: 2026-07-15
- Dependency: T5-061 (`DONE - PASS`)

## Delivered

- Selected, unlocked, editable video results now expose five representative 160x90 keyframe previews in a quiet Canvas-local rail.
- One detached, cancellable sampler extracts previews without seeking or interrupting the visible native video.
- Clicking a frame seeks native playback to its exact timestamp, marks one active playhead through accessible semantics, and emits no graph or provider mutation.
- The existing explicit frame capture then uploads a real PNG and creates one durable collision-aware image node with exact source-video and timestamp provenance.
- Selection/source changes release the sampler immediately. Decode/export failure stays local to an accessible rail state while native playback remains available.
- The rail chooses above or below from neighboring-node clearance, stays within selected media width, leaves native controls unobstructed, and uses existing graphite/violet tokens.
- Readonly, locked, unselected, unavailable, and broken media expose no mutable rail.

## Verification

- Focused keyframe, capture, recovery, undo/redo, reload, and race suite: PASS, 9/9.
- Related multi-scenario, node workflow, result branch, remix, lineage, and capture matrix: PASS, 42/42.
- Production build: PASS, 4,818 modules transformed.
- Real dynamic MP4 evidence proves five decoded thumbnails, exact click-to-seek, active state, PNG bytes, durable upload, and selected timestamp provenance.
- Extraction-failure evidence proves zero frame actions, visible local error, native video availability, and zero PATCH.
- Visual evidence inspected:
  - `output/playwright/t5-062-video-keyframes/selected-keyframe-rail-1440x900.png`
  - `output/playwright/t5-062-video-keyframes/captured-from-keyframe-1440x900.png`
  - `output/playwright/t5-062-video-keyframes/compact-keyframe-rail-920x760.png`
- Backend tests were not required because the implementation is browser-local and reuses the previously verified upload/command contract without changing API, persistence, provider, quota, or schema behavior.
- Diff, whitespace, file-size, sensitive-path, and staging-scope checks: PASS.

## Product result

Video is no longer only a playback endpoint on the Canvas. Creators can visually scan representative moments, move to an exact frame, and turn that moment into a durable image source for later multi-node image or video generation without leaving the graph.
