# REPORT-T5-070 - Honest generation reference compatibility

## Outcome

T5-070 is `DONE - PASS`.

New Canvas authoring now offers generation references only for image sources the current provider request can consume. Video, audio, text-result, and generation-task outputs no longer create misleading media connections, while historical unsupported edges remain visible as excluded provenance.

## Implementation

- Kept `getDefaultConnectionPorts` as the lossless structural resolver for persisted graph reading.
- Added `getAuthoringConnectionPorts` as the semantic resolver for new mutations.
- Canonical image assets/results and legacy image nodes remain valid generation references.
- Applied the authoring resolver to continuation, direct connect, reconnect, edge insertion, workflow starters, selection composition, resource branching, and compatible-drop presentation.
- Kept generation context/order/lineage on structural reading so old unsupported edges remain inspectable.

## Verification

- Focused registry, continuation, command, and continuation-trigger coverage: PASS, 29/29.
- Cross-surface connection, reroute, insertion, generation context/order/provenance, and selection composition regression: PASS, 85/85.
- Frontend production build: PASS, 4,820 modules transformed.
- Desktop visual evidence:
  - `output/playwright/t5-070-honest-generation-reference/video-asset-no-generation-continuation-1440x900.png`
  - `output/playwright/t5-070-honest-generation-reference/legacy-video-reference-excluded-1440x900.png`

The browser proves a selected video asset retains playback, frame capture, keyframes, selection, and Inspector but exposes no continuation affordance. A persisted video-to-generation edge remains visible with `R×`, muted lineage, one excluded edge, `3 项已使用`, and `仅支持图片，未使用`, with zero document mutation.

## Product boundary

This Task does not add video-to-video provider support or delete old edges. It removes unsupported new authoring and preserves historical graph honesty. Provider image order, multi-image keyframes, quota, generation execution, and result lineage remain unchanged.
