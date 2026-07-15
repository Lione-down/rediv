# REPORT-T5-066 - Generated video playback inside Canvas nodes

## Outcome

T5-066 is `DONE - PASS`.

Valid generated videos are directly playable inside Canvas result nodes. CORS-readable media keeps frame extraction, while a valid remote video without ACAO falls back once to ordinary native playback instead of being reported unavailable.

## Root cause

`CanvasNodeMedia.vue` always set `crossorigin="anonymous"`. Against an independent cross-origin HTTP server serving a valid range-capable MP4 without ACAO, the project asset panel decoded and played the URL, but the Canvas node failed with `MEDIA_ERR_SRC_NOT_SUPPORTED` and a browser CORS error. The same response proved valid content type, length, range support, duration, and decoded dimensions, ruling out the URL, codec, and range hypotheses for the reported condition.

## Implementation

- Kept anonymous CORS as the first load so readable media retains keyframes and frame capture.
- Recreated the video once without `crossOrigin` after the first media error, exposing `playback-only` as the active capability.
- Prevented playback-only media from rendering frame-capture or keyframe actions that would fail on a tainted Canvas.
- Added Space/K play-pause, arrow seek, and arrow volume controls at the video host while stopping events from reaching Canvas gestures.
- Made the second media error terminal, preventing fallback loops and preserving honest failure presentation.

## Verification

- Focused real-network playback and failure matrix: PASS, 6/6.
- Related Canvas workflow, frame capture, fallback/zoom, lineage, result branching, selection output, and multi-scenario regression: PASS, 50/50.
- Frontend production build: PASS, 4,820 modules transformed.
- Desktop 1440x900: playback-only video with native controls.
- Compact 920x900: canvas-readable video with bounded five-frame rail and capture action.
- Readonly 375x812: terminal invalid-media state within the review-only overview.

The browser contract covers asset-panel parity, one-shot fallback, keyboard play/pause/seek/volume, time progression, duration and decoded dimensions, CORS-readable frame tools, reload, 403, 404/non-video, unsupported codec, second-load failure, request-count bounds, and zero graph mutation. No real or paid provider call was made.

## Product boundary

Playback capability and Canvas readability are intentionally separate. The fallback restores ordinary viewing but cannot safely support frame extraction. No backend proxy, transcoding, provider change, URL migration, or custom player chrome was introduced.
