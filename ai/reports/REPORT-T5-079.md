# REPORT-T5-079 - Canvas media containment and keyframe rail isolation

- Decision: `DONE - PASS`
- Date: 2026-07-16
- Scope: frontend Canvas media rendering, browser regression, and project-state documentation only.

## Outcome

Image and video media roots now remain inside their canonical Canvas surfaces. Video keyframe previews still choose above/below placement, but that positioning is owned by the rail itself and can no longer move the shared media root.

## Root cause

`CanvasVideoKeyframeRail.vue` declared a parent-state `:global(.canvas-node-media.is-keyframes-above) .video-keyframe-rail` rule inside scoped CSS. The production compiler emitted a rule targeting `.canvas-node-media.is-keyframes-above` itself. `CanvasNodeMedia.vue` also applied that class to every media kind, so image roots were positioned upward by their own height plus 8px and rendered outside their card frames.

## Implementation

- Added a rendered DOM containment guard to the deterministic mixed image/video browser scenario.
- Removed keyframe placement classes from the shared `.canvas-node-media` root.
- Added an explicit optional `placement` prop to `CanvasVideoKeyframeRail` and applied `is-above` only to `.video-keyframe-rail`.
- Retained the existing placement resolver, sampling, seek, capture, playback, responsive, readonly, and graph contracts.
- Recorded the scoped-child-overlay selector pitfall in `pitfalls.md`.

## Verification

- TDD RED: focused mixed-media scenario failed as expected with four escaped decoded images; measured vertical offsets were `-141px` and `-244px`.
- TDD GREEN: the same focused scenario passed 1/1 after rebuilding the preview bundle.
- Related Chromium regression: 23/23 passed across mixed media, four supported viewports, keyframe seek/capture, toolbar clearance, compact/readonly, playback ownership, CORS fallback, and bounded media failures.
- Production build: `vue-tsc -b && vite build` passed with 4,841 transformed modules.
- Built CSS audit: rail-local `.video-keyframe-rail.is-above` is present; the leaking `is-keyframes-above`/parent-global selector has zero source/test matches.
- Visual inspection passed for `output/playwright/t5-017-connected-context/mixed-topology-1440x900.png` and `output/playwright/t5-062-video-keyframes/selected-keyframe-rail-1440x900.png`.
- Dev server: `http://127.0.0.1:5173` returned HTTP 200 after the source update.
- Hygiene: `git diff --check`, strict UTF-8 reads, file-size review, changed-path sensitive-name scan, and scoped worktree audit passed.

## Blast check

- `keyframeRailPlacement` remains only at the media-to-video-rail boundary.
- No `is-keyframes-above` or parent-global media selector remains in frontend source or tests.
- No sibling fix is required; the only above/below positional CSS now belongs to the rail root that it positions.

## Boundaries preserved

- No Canvas document, node geometry, connection, history, selection, camera, backend, database, provider, quota, or generation request behavior changed.
- No paid call, real secret access, migration, or user/runtime data operation occurred.
- Pre-existing untracked `.hermes` plans and `output/` evidence were not staged.
