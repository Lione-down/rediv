# REPORT-T5-059 - Two-origin video keyframe generation

- Result: `DONE - PASS`
- Date: 2026-07-15
- Dependency: T5-058 (`DONE - PASS`)

## Delivered

- A real browser scenario now uses G1 V2 and G2 V1 as two ordered keyframes for one downstream video generation.
- The request preflight exposes exact `视频关键帧 R1` and `视频关键帧 R2` semantics with their source-result titles.
- Reorder moves G2 V1 to R1 and G1 V2 to R2 without changing either canonical V or origin identity.
- The mock video provider receives the exact final prompt, downstream node ID, and reordered `asset-second-origin`, `asset-generated` image sequence.
- Success decrements video quota once and materializes one durable video asset, active generation-to-result edge, task identity, model identity, and canonical V1 lineage.
- The returned MP4 is proven playable through native `play()`, positive duration, decoded width and height, then remains playable and inspectable after reload.
- 920px preflight remains inside the bounded drawer; 375px readonly exposes both origins without generation/reorder controls or graph PATCHes.
- No business-code correction was required; existing provider, transaction, materialization, media, and lineage contracts satisfy the stronger scenario.

## Verification

- Production build: PASS, 4,815 modules transformed.
- Focused chained lineage and result branch suite: PASS, 12/12.
- Guarded backend Agnes provider, video generate, and video E2E: PASS, 15/15.
- Related Canvas identity, ordering, provenance, navigation, remix, and lineage matrix: PASS, 52/52.
- Visual evidence inspected:
  - `output/playwright/t5-057-multi-origin-navigation/two-origin-playable-video-reload-1440x900.png`
  - `output/playwright/t5-057-multi-origin-navigation/two-origin-video-keyframes-compact-920x900.png`
  - `output/playwright/t5-057-multi-origin-navigation/two-origin-video-readonly-375x812.png`
- Drawer transition geometry is polled to its stable boundary before screenshot capture; no fixed delay is used.
- Diff, whitespace, file-size, sensitive-path, and staging-scope checks: PASS.

## Product result

Multi-generation video composition now has end-to-end proof from two independently generated image histories to ordered keyframes, exact provider input, a durable playable video result, and canonical reload lineage.
