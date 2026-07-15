# REPORT-T5-032 - Branch generation from image result

- Result: `DONE - PASS`
- Date: 2026-07-15
- Baseline: `111d7c9aec8097d5bc4432d56771d16b6dca0230`

## Delivered

- Eligible image results expose one quiet contextual disclosure with image and video generation choices.
- Choosing a branch creates one generation node and one canonical active `result.out -> generation.media` edge with durable `input_order: 1` in a single undoable command.
- Placement scans persisted graph bounds and selects the first non-overlapping right-side slot.
- The new generation reuses the existing prompt, preflight, quota, provider request, task history, asset, result, and lineage lifecycle without automatic execution.
- Result branching and input reordering are kept out of the near-limit workspace shell through a focused node-action composable.
- Locked, grouped, unsupported, video, missing-asset, and readonly results remain action-free.

## Verification

- Frontend build: PASS, 4,801 modules transformed.
- Focused branch and placement tests: PASS, 5/5 Chromium.
- Related generation, context, lineage, continuation, and command regression: PASS, 41/41 Chromium.
- Post-extraction command and input-order regression: PASS, 11/11 Chromium.
- Full frontend regression: PASS, 220/220 Chromium in 3.8 minutes.
- Browser chain: image result -> video generation -> exact `image_ids` payload -> playable MP4 result -> reload identity, PASS.
- Visual review: desktop branch disclosure and generated video workflow accepted; 920px compact drawer remains bounded.
- Hygiene: `git diff --check`, UTF-8, file-size, staged-path, and sensitive-path gates passed.

## Retained evidence

- `output/playwright/t5-032-result-branch/result-branch-menu-1440x900.png`
- `output/playwright/t5-032-result-branch/result-video-result-1440x900.png`

The evidence directory is local test output and is intentionally excluded from the commit.

## Deferred boundaries

- No automatic provider execution.
- No video-as-reference or text-result branching.
- No backend or mobile-editing changes.
- No paid provider call or secret access.
