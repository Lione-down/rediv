# REPORT-T5-048 - Video current-frame reuse as Canvas image input

- Result: `DONE - PASS`
- Date: 2026-07-15
- Baseline: `86c26ed92da47305584ba2b46c9add10ede9de08`

## Delivered

- Selected editable video nodes expose one restrained `截取当前帧` action after decode.
- Capture uses the exact `HTMLVideoElement.currentTime`, intrinsic dimensions, anonymous CORS, Canvas draw, and PNG encoding.
- The PNG uploads through the existing project asset API and becomes a collision-aware canonical image asset node.
- The inserted node records source video node ID, capture time, aspect ratio, project ownership, and asset ID.
- Success selects and reveals the new node; graph insertion remains one undo/redo/autosave boundary and reloads durably.
- The captured frame is a normal ordered image reference for both image and video multi-selection generation.
- Upload and stale-Canvas failures insert no node and surface accessible Canvas feedback.

## Reference adaptation

- The public AIGCCanvasFlow project demonstrates a useful video-frame-to-image creative loop.
- Revid adapts that loop through its own contextual action, project asset, command, placement, persistence, and composition contracts rather than copying the persistent frame-strip component.

## Verification

- Frontend build: PASS, 4,810 modules transformed.
- Focused frame capture Chromium: PASS, 7/7, including locked-node exclusion.
- Related resource, selection composition, media, lineage, multi-scenario, and frame capture Chromium: PASS, 45/45.
- Real browser mock evidence extracted the uploaded PNG bytes from multipart and served them back unchanged; decoded dimensions were exactly 160x90.
- Upload failure and in-flight Canvas switch: PASS, zero document insertions.
- `git diff --check`: PASS.
- Visual inspection: PASS at 1440x900, 920x760, and readonly 375x812 behavior.

## Evidence

- `output/playwright/t5-048-video-frame-capture/selected-video-capture-action-1440x900.png`
- `output/playwright/t5-048-video-frame-capture/captured-frame-selected-1440x900.png`
- `output/playwright/t5-048-video-frame-capture/compact-selected-video-920x760.png`
- `output/reference/aigc-canvas-flow/preview-2.png`

## Deferred

- Full frame strips, batch extraction, transcoding, backend video processing, provider calls, audio extraction, and mobile editing remain outside scope.
