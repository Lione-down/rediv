# TASK-T5-066 Progress

- Task state: `DONE - PASS`
- Active unit: complete and verified.

## Completed work

- Confirmed the root cause in `CanvasNodeMedia.vue`: the same no-ACAO range-capable MP4 plays in `CanvasAssetPanel.vue`, while the node's forced anonymous CORS request fails with media error code 4 and a browser CORS console error.
- Preserved the canvas-readable anonymous-CORS first load and added one keyed playback-only fallback without `crossOrigin`.
- Kept frame capture and the five-frame rail exclusive to canvas-readable media; playback-only media remains playable without exposing taint-prone frame tools.
- Added host-level keyboard media controls: Space/K play-pause, left/right seek, and up/down volume. Events stop before Canvas selection, drag, and pan handlers.
- Kept the second failure terminal, so 403, 404/non-video, unsupported codec, and failed playback-only reloads remain explicit bounded errors.
- Verified reload, asset-panel parity, compact drawer ownership, readonly review, and zero document mutation.

## Remaining work

- None for T5-066. Real provider smoke remains a Human-gated paid action and was not required because the exact transport condition was reproduced with an independent HTTP origin.

## Exact next action

Release the active Task slot. In a later bounded run, audit the next unresolved Canvas/media or multi-node scenario against the persistent Canvas iteration goal.

## Files changed

- `frontend/src/components/canvas/CanvasNodeMedia.vue`
- `frontend/tests/e2e/canvas-resource-generation-fixture.ts`
- `frontend/tests/e2e/canvas-video-node-playback.spec.ts`
- T5-066 Task, state, REPORT, and pitfalls documentation.

## Commands and evidence

- Diagnostic RED: asset panel decoded and progressed the no-ACAO MP4; Canvas node failed under forced anonymous CORS with error code 4 and no graph PATCH.
- Focused playback matrix: PASS, 6/6.
- Related workflow, frame capture, fallback/zoom, lineage, branching, selection output, and multi-scenario matrix: PASS, 50/50.
- Frontend production build: PASS, 4,820 modules transformed.
- Visual evidence: `output/playwright/t5-066-video-node-playback/` at 1440x900, 920x900, and 375x812.
- No backend, provider, database, real-secret, paid-call, or durable document contract changed.

## Blockers

- None.
