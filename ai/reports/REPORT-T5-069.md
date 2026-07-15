# REPORT-T5-069 - Canvas single-active video playback

## Outcome

T5-069 is `DONE - PASS`.

Canvas video review now has one active playback owner. Starting a second video node pauses the first in place, and comparison-tray previews exchange ownership with their background Canvas counterparts without overlapping motion or audio.

## Implementation

- Added one namespaced playback ownership signal shared by mounted `CanvasNodeMedia` instances.
- A playing video broadcasts its native element; peer instances pause only when currently playing.
- Listeners are mounted and removed with each media component, including comparison-tray instances.
- Native controls, Space/K playback, time, volume, mute, CORS fallback, keyframes, and frame capture remain unchanged.

## Verification

- Focused playback ownership: PASS, 2/2.
- Related video playback, result lineage/comparison, multi-scenario visual, and captured-frame regression: PASS, 30/30.
- Frontend production build: PASS, 4,820 modules transformed.
- Desktop 1440x900 visual evidence: `output/playwright/t5-069-video-playback-ownership/tray-video-owns-playback-1440x900.png`.

Browser evidence proves node-to-node and tray-to-background ownership in both directions. Losing ownership pauses without rewind, keyboard `K` reacquires ownership, and document PATCH remains zero. Invalid, expired, unsupported, no-ACAO, playback-only, canvas-readable, keyframe, capture, compact, and readonly cases remain green.

## Product boundary

Coordination applies only to `CanvasNodeMedia`. It does not autoplay, mute, mix audio, control project-resource videos, alter graph state, or change provider behavior.
