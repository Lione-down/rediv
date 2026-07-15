# REPORT-T5-030 - Selection composition output validation

- Result: `DONE - PASS`
- Date: 2026-07-15
- Baseline: `9d941395cb62318ea84a9a102a7a591bd06cc13a`

## Outcome

Multi-selection composition now previews the exact request-ready text and image counts before creation and labels video intent as text-to-video, img2vid, or ordered keyframes. Workflows created from that menu are verified through actual image/video request, task, asset, quota, canonical result, edge, lineage, media, history, reload, and failure reconciliation boundaries.

## Implementation

- `selection-generation.ts` exposes a pure intent projection derived from the same validated composition command used to create the graph.
- `CanvasSelectionToolbar.vue` presents a low-noise payload summary and semantic image/video option detail without changing the existing token system.
- The shared resource fixture responds to both image and video routes with the requested dynamic node identity, correct media/model/quota identity, and a decodable PNG or playable MP4.
- Failure tasks bind to the composed node and media type, remain durable, create no result, debit no quota, and do not retry.

## Verification

- Build: PASS, 4,800 modules.
- Focused T5-030 Chromium: PASS, 4/4.
- Related generation, selection, preflight, and lineage Chromium: PASS, 27/27.
- Full Chromium: PASS, 210/210.
- Visual: PASS at 1440x900; retained evidence is `output/playwright/t5-030-selection-output/composed-video-result-1440x900.png`.
- Hygiene: `git diff --check` PASS; changed product/test files remain below 500 lines.

## Boundaries

Evidence is mock-browser lifecycle evidence. No paid provider call, real secret, backend mutation, database operation, or mobile editing change occurred.
