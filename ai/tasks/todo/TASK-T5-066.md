# TASK-T5-066 - Generated video playback inside Canvas nodes

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 Canvas refinement
- Dependency: T5-065 must be `DONE - PASS`
- Owner: Codex Project Lead Engineer
- Requested: 2026-07-15

## Activation rule

- Do not activate, implement, stage, or mix this Task while T5-064 or T5-065 is active.
- The executing session must first confirm the preceding Task is committed and pushed, `CURRENT` is released, and worktree ownership is clear.
- Only then place T5-066 in the single `DOING` slot and create or refresh its PLAN and PROGRESS before editing business code.

## Reported symptom

A video generated successfully and materialized as a Canvas result cannot be played directly through the controls on its result node.

## Objective

Make every valid generated-video result directly playable, pausable, seekable, and keyboard operable inside its Canvas node without breaking Canvas selection, pan/zoom, video keyframes, frame capture, reload, compact review, or honest unavailable-media states.

## Current source evidence

- `frontend/src/components/canvas/CanvasNodeMedia.vue` already renders generated video as a native `<video controls preload="metadata">` element.
- The node video always sets `crossorigin="anonymous"`; `CanvasAssetPanel.vue` renders project video assets without forcing that CORS mode.
- Existing Chromium media fixtures always return `Access-Control-Allow-Origin: *`, valid `video/mp4`, and byte-range responses.
- Existing playback tests mostly invoke `HTMLVideoElement.play()` programmatically against those CORS-friendly mocks; they do not prove that a user can operate the native controls against a real Agnes-style cross-origin URL.
- No existing backend same-origin media playback proxy was found in the inspected source path.

## Root-cause hypotheses to prove or discard

1. Leading hypothesis: forcing anonymous CORS on the node turns a browser-playable Agnes CDN URL into a failed CORS media request when the remote response omits a compatible `Access-Control-Allow-Origin` header.
2. Interaction hypothesis: the video decodes, but Canvas pointer or keyboard ownership prevents native controls from receiving the user gesture.
3. Media-boundary hypothesis: the persisted URL is expired, redirects to a non-media response, lacks usable range/content headers, uses an unsupported codec, or is otherwise not directly browser-playable.

Do not implement a fix until one sentence names the confirmed file/condition and evidence that explains the affected runtime.

## Required diagnostic gate

- Reproduce with an already persisted affected generated-video asset when available. Do not make a new real or paid Agnes call.
- Compare the exact same asset URL in the Canvas node and project asset panel.
- Record, without exposing the full signed URL, `HTMLMediaElement.error.code`, `readyState`, `networkState`, `paused`, `currentSrc` origin, and `crossOrigin` mode.
- Inspect the media request status, redirect chain, `Content-Type`, `Content-Length`, `Accept-Ranges`, `Content-Range`, CORS headers, and browser console error.
- Verify both programmatic `play()` and a real user gesture through pointer or keyboard controls.
- Use this decision table:
  - Asset panel plays and node fails: prove the node CORS or interaction delta before changing source policy.
  - Programmatic play works but pointer/keyboard play fails: fix native-control event ownership, not media transport.
  - Both surfaces fail: diagnose URL validity, response headers, range support, codec, mixed content, or expiry before changing Canvas code.

## Scope

- Establish one deterministic media-source policy for Canvas video playback.
- Keep native controls visible and usable at the actual node surface.
- If CORS is the confirmed cause, allow at most one explicit CORS-to-playback fallback for a valid remote video. Prevent error/reload loops and make the active playback capability observable in tests.
- Keep canvas-readable playback separate from ordinary playback capability. A no-CORS fallback must never expose frame capture or keyframe extraction as available when drawing the media would taint a canvas.
- Preserve the current CORS-readable path and frame-capture behavior for same-origin or CORS-enabled videos.
- Keep invalid, expired, unsupported, and genuinely unavailable media in the existing explicit error state.
- Preserve result lineage, generation history, selection, toolbar, Inspector, comparison tray, reload, and readonly behavior.

## Non-goals

- Autoplay, custom video-player chrome, transcoding, codec conversion, provider API changes, or video-generation prompt changes.
- New real Agnes calls, external accounts, secret access, database schema changes, or destructive asset migration.
- A general remote-media proxy unless runtime evidence proves it is required. If a proxy becomes necessary, stop and split or explicitly approve its SSRF, authorization, redirect, range-streaming, timeout, size, cache, and signed-URL security contract before implementation.
- Mobile Canvas editing; 375px remains review-only.

## Acceptance criteria

- A valid generated-video result can be started by a real pointer or keyboard user gesture directly on its Canvas node.
- Play, pause, seek, volume, duration, decoded dimensions, and current-time progression work without selecting, dragging, panning, or mutating the graph unexpectedly.
- A representative cross-origin video without permissive CORS is covered when that is the confirmed production condition; playback succeeds without an infinite fallback loop.
- A CORS-readable video retains keyframe rail and frame-capture behavior.
- A playback-only fallback does not show capture/keyframe actions that cannot succeed, and it does not report the playable video as unavailable.
- Invalid media, non-video content, 403/404, expired URL, unsupported codec, and second-load failure remain explicit, bounded error states.
- Reload preserves the same playable result and lineage without document mutation or duplicate result creation.
- Desktop `1440x900`, compact `920x900`, and review-only `375x812` remain bounded and keyboard accessible.
- Existing image media, asset-panel video playback, comparison tray, generation transactions, and video result persistence remain unchanged.

## Recommended implementation touchpoints

The executing session must verify these locations against the post-T5-065 tree before editing.

- `frontend/src/components/canvas/CanvasNodeMedia.vue`: media load state, source/CORS mode, native control event ownership, one-shot fallback, capture capability.
- `frontend/src/components/canvas/CanvasVideoKeyframeRail.vue`: only if playback capability must be separated from canvas-readable/keyframe capability.
- `frontend/src/components/canvas/canvas-node-interaction.ts` and `CanvasNodeSurfaceLayer.vue`: only if the confirmed cause is pointer/keyboard routing.
- `frontend/tests/e2e/canvas-resource-generation-fixture.ts`: add distinct CORS-enabled, no-ACAO, invalid, and failed media responses without weakening the existing byte-range fixture.
- Add a focused `frontend/tests/e2e/canvas-video-node-playback.spec.ts` instead of expanding an unrelated large visual spec.

Do not add a backend endpoint unless the diagnostic gate proves a frontend playback policy cannot safely satisfy the contract.

## Delivery sequence

1. Re-read active project state and inspect post-T5-065 overlap.
2. Activate T5-066 and create PLAN/PROGRESS with the exact reproduction and root-cause hypothesis.
3. Reproduce the affected runtime and complete the diagnostic gate before production edits.
4. Add RED Chromium coverage for the confirmed failure, including a real user gesture rather than only programmatic playback.
5. Implement the smallest confirmed fix and preserve frame-capture capability boundaries.
6. Run focused playback tests, then related video generation, result, lineage, frame-capture, fallback, responsive, and build regression.
7. Inspect real browser playback at the required viewports, perform diff and sensitive-path review, update state documents, and write REPORT only after all criteria pass.
8. Commit and push one scoped fix after the worktree contains no unrelated staged files.

## Suggested verification commands

```powershell
cd frontend
npx playwright test tests/e2e/canvas-video-node-playback.spec.ts tests/e2e/canvas-node-workflow.spec.ts tests/e2e/canvas-video-frame-capture.spec.ts tests/e2e/canvas-media-fallback-zoom.spec.ts
npx playwright test tests/e2e/canvas-result-lineage.spec.ts tests/e2e/canvas-result-branch-generation.spec.ts tests/e2e/canvas-selection-generation-output.spec.ts tests/e2e/canvas-multi-scenario-visual.spec.ts
npm run build
```

If the confirmed fix touches backend media delivery, add the smallest applicable backend security and range-streaming suite before any frontend regression claim.

## Risks and release guards

- Removing or changing `crossOrigin` can restore playback while silently breaking frame capture through a tainted canvas. Playback and canvas-readability must be modeled separately.
- The `crossOrigin` mode must be set before assigning `src`; an incorrect reactive ordering can cause duplicate requests or another failed load.
- An unconditional retry on the media `error` event can create an infinite request loop. Permit one classified fallback only.
- Mock playback can pass while real signed URLs fail because mocks currently provide ideal CORS and range headers. Retain at least one deliberately non-CORS fixture.
- Programmatic `play()` bypasses the exact native-control interaction the user reported. At least one regression must use keyboard or pointer input.
- Expired URLs and unsupported codecs are not CORS bugs. Do not hide them behind fallback behavior or report them as fixed.
