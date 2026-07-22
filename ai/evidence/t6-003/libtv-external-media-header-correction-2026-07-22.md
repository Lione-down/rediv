# T6-003 LibTV external media metadata header correction

## Trigger and source

- Trigger: renewed completion audit against the Human-supplied Revid and selected `三花小猫` screenshots after Units 6F and 6G.
- Official reference: `C:/Users/mkd/AppData/Local/Temp/codex-clipboard-81d95e1a-9cea-4ebc-af12-a52702265f0c.png`.
- Pre-correction Revid evidence: `output/playwright/t6-003-materialized-card/selected-materialized-image-card.png`, historical SHA-256 `487326D2C237920CEF5B275D64000F7F9BF4AA549748E3119A64B8F6CCC3EA4E`.
- Observation is clean-room and read-only. No LibTV source, private implementation, credential, upload, generation, graph mutation, or paid action is used.

## Remaining visible delta

- Official: node label and decoded resolution sit outside the image on one quiet header line, title left and resolution right.
- Revid: the external node label is already correct, but decoded resolution remains a bordered translucent pill inside the image at the bottom-right.
- The value and timing are already truthful. Only presentation placement and material are incorrect.

## Unit 6H acceptance evidence

1. Ready image/video resolution remains the exact decoded natural dimensions and retains `aria-label="媒体分辨率"`.
2. Resolution is a sibling of the clipped media viewport rather than its child, so it can occupy the external header.
3. Its right edge aligns to the media right edge within `2 CSS px`; its bottom remains above the media viewport with a quiet `4-8 CSS px` gap at 100%.
4. The resolution has transparent background, zero border, no backdrop filter, tabular numerals, and no pill radius.
5. Delayed metadata, aspect-ratio adoption, image/video playback, capture/status overlays, selected geometry, ports, composer, compact and readonly boundaries, and zero document PATCHes remain unchanged.
6. Desktop selected and `920x900` compact captures are manually inspected before renewed Human review.

## Implemented evidence

- `CanvasNodeMedia.vue` keeps the exact ready-state natural-dimension value and `媒体分辨率` accessible name, but renders it outside the clipped viewport as a quiet top-right header sibling. At 100%, the right edge aligns within `2 CSS px` and the header-to-media gap is `6 CSS px`.
- The metadata background is transparent; border, radius, and backdrop filter are removed; tabular numerals remain. Image/video loading, failure, playback, capture, metadata emit, aspect-ratio adoption, and zero-mutation behavior are unchanged.
- Selected video proof explicitly confirms the resolution header overlaps neither the video viewport nor its keyframe rail.
- Current desktop selected: `output/playwright/t6-003-materialized-card/selected-materialized-image-card.png`, SHA-256 `AE96A6E80ACA98240FCA765201747C913BD32752C59A599C7FB06F41C6EC3A88`.
- Current compact selected: `output/playwright/t6-003-materialized-card/selected-materialized-image-card-920x900.png`, SHA-256 `CB24B37A87FD80DAE7AD82F92E7F98C69CA6F5C550277E74431F749F75DD8596`.
- Current idle: `output/playwright/t6-003-materialized-card/idle-materialized-image-card.png`, SHA-256 `75DD98A2F69EB4592A562A61BD14CFF70A2DD341CFD7A43F6845C8CC63323B22`.
- Verification: exact header `1/1`; viewport matrix `1/1`; related media/card/video `42/42`; three-axis `7/7`; production build `4,972`; full Chromium `596/596` in `9.5m`; performance `2/2` in `1.1m`; audit `0`.
- Snapshot governance: exactly three populated parity snapshots changed for the expected pill-to-header move. `t5-096-snapshot-overlay-2026-07-21.json` carries their new hashes, and the fresh normal suite passes at the unchanged `0.002` threshold.
